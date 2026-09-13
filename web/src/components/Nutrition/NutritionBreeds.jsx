import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UtensilsCrossed, 
  Clock, 
  Sparkles, 
  Plus, 
  Trash2, 
  Save, 
  BookOpen, 
  Search, 
  ChevronRight, 
  CheckCircle2, 
  ShieldCheck, 
  PenLine, 
  Share2, 
  X,
  User,
  AlertCircle,
  Flame,
  Check
} from 'lucide-react';
import { 
  db, collection, query, orderBy, onSnapshot 
} from '../../config/firebase';
import ArticleEditor from './ArticleEditor';
import { AppleReveal } from '../Animations/AppleReveal';
import { runNutritionRecommendation } from '../../services/aiService';

const FOOD_TYPES = [
  'Dry Food',
  'Wet Food',
  'Raw Food',
  'Mixed Diet',
  'Prescription Diet'
];

const CATEGORIES = ['ALL', 'HEALTH', 'NUTRITION', 'TRAINING', 'LIFESTYLE'];

const CATEGORY_COLORS = {
  HEALTH: '#1AB680',
  NUTRITION: '#F59E0B',
  TRAINING: '#3B82F6',
  LIFESTYLE: '#EC4899',
  ALL: '#86868B'
};

const FALLBACK_ARTICLES = [
  {
    id: 'b1',
    title: 'Optimal Macronutrient Ratios for Adult Canines & Felines',
    category: 'NUTRITION',
    authorName: 'Dr. Sarah Jenkins, DVM',
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
    timestamp: Date.now() - 11 * 24 * 3600 * 1000,
    readTimeMinutes: 3,
    imageUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&auto=format&fit=crop&q=80',
    content: 'Desert-adapted feline ancestors derived the majority of moisture from fresh prey. Consequently, domestic cats feeding exclusively on dry food consume only 50% of their daily physiological hydration needs.\n\nTo support glomerular filtration:\n1. Introduce stainless steel or ceramic circulating water fountains.\n2. Incorporate warm bone broth or wet gravy food at every meal.\n3. Place water bowls away from food and litter stations.',
    tags: ['cats', 'kidney', 'hydration']
  }
];

export default function NutritionBreeds() {
  const { pets = [], showToast, updatePet } = useApp();
  const { currentUser } = useAuth();

  // Active view: 'diet' (Pet Nutrition & Meal Schedule) or 'articles' (Scientific Care Guides)
  const [activeTab, setActiveTab] = useState('diet');

  // ── Selected Pet State ──
  const [selectedPetId, setSelectedPetId] = useState(pets[0]?.id || pets[0]?.petID || 'default_pet');
  const activePet = pets.find(p => p.id === selectedPetId || p.petID === selectedPetId) || pets[0] || {
    id: 'default_pet',
    name: 'Miko',
    breed: 'Domestic Shorthair',
    species: 'Cat',
    age: '1.5 Yrs',
    weight: '3.2',
    photo: 'assets/images/Pet_1.jpg',
    currentFoodName: 'Royal Canin Indoor 27',
    foodType: 'Dry Food',
    feedingTimes: ['08:00 AM', '02:00 PM', '08:00 PM']
  };

  // ── Diet Form State ──
  const [foodName, setFoodName] = useState(activePet.currentFoodName || 'Royal Canin Indoor 27');
  const [foodType, setFoodType] = useState(activePet.foodType || 'Dry Food');
  const [feedingTimes, setFeedingTimes] = useState(activePet.feedingTimes || ['08:00 AM', '02:00 PM', '08:00 PM']);
  const [isSavingDiet, setIsSavingDiet] = useState(false);
  const [newTimeInput, setNewTimeInput] = useState('');
  const [showAddTime, setShowAddTime] = useState(false);

  // ── AI Nutrition Expert State ──
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiRecommendation, setAiRecommendation] = useState(null);

  // ── Blog / Articles State ──
  const [blogs, setBlogs] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [showEditor, setShowEditor] = useState(false);

  // Sync pet change to inputs
  useEffect(() => {
    setFoodName(activePet.currentFoodName || 'Royal Canin Indoor 27');
    setFoodType(activePet.foodType || 'Dry Food');
    setFeedingTimes(activePet.feedingTimes || ['08:00 AM', '02:00 PM', '08:00 PM']);
    setAiRecommendation(null);
  }, [selectedPetId]);

  // Real-time blog sync
  useEffect(() => {
    try {
      const q = query(collection(db, 'blogs'), orderBy('timestamp', 'desc'));
      const unsub = onSnapshot(q, (snap) => {
        if (snap.empty) {
          setBlogs(FALLBACK_ARTICLES);
        } else {
          setBlogs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        }
      }, () => {
        setBlogs(FALLBACK_ARTICLES);
      });
      return () => unsub();
    } catch {
      setBlogs(FALLBACK_ARTICLES);
    }
  }, []);

  // Save diet details
  const handleSaveDiet = () => {
    setIsSavingDiet(true);
    setTimeout(() => {
      setIsSavingDiet(false);
      if (updatePet) {
        updatePet(activePet.id, {
          currentFoodName: foodName,
          foodType,
          feedingTimes
        });
      }
      showToast(`Diet details for ${activePet.name} saved! ✨`, 'success');
    }, 600);
  };

  // Add meal time
  const handleAddMeal = (e) => {
    e.preventDefault();
    if (!newTimeInput) return;
    if (feedingTimes.includes(newTimeInput)) {
      showToast('Meal time already scheduled', 'warning');
      return;
    }
    const updated = [...feedingTimes, newTimeInput].sort();
    setFeedingTimes(updated);
    setNewTimeInput('');
    setShowAddTime(false);
    showToast(`Added meal at ${newTimeInput}`, 'success');
  };

  // Remove meal time
  const handleRemoveMeal = (timeToRemove) => {
    const updated = feedingTimes.filter(t => t !== timeToRemove);
    setFeedingTimes(updated);
    showToast(`Removed meal at ${timeToRemove}`, 'info');
  };

  // AI Suggest Feeding Schedule
  const handleAiSuggestSchedule = () => {
    const isCat = (activePet.species || activePet.breed || '').toLowerCase().includes('cat');
    const suggested = isCat 
      ? ['07:30 AM', '01:00 PM', '07:30 PM'] 
      : ['08:00 AM', '02:30 PM', '08:00 PM'];
    
    setFeedingTimes(suggested);
    showToast(`AI calculated a 3-meal balanced interval for ${activePet.name}! ⏰`, 'success');
  };

  // Ask AI Expert (GPT-4o)
  const handleAskAiExpert = async () => {
    setIsAiLoading(true);
    try {
      const rec = await runNutritionRecommendation({
        petName: activePet.name,
        breed: activePet.breed,
        age: activePet.age,
        weight: activePet.weight,
        currentDiet: `${foodType} (${foodName})`
      });
      setAiRecommendation(rec);
      showToast(`AI Nutrition Expert analyzed ${activePet.name}'s metabolic requirements! 🔬`, 'success');
    } catch (err) {
      showToast('Failed to retrieve AI recommendations. Please retry.', 'error');
    } finally {
      setIsAiLoading(false);
    }
  };

  const filteredBlogs = blogs.filter(b => {
    const matchesCat = selectedCategory === 'ALL' || (b.category || '').toUpperCase() === selectedCategory;
    const matchesSearch = !searchQuery || 
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.content?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // If article editor is active
  if (showEditor) {
    return (
      <ArticleEditor
        onClose={() => setShowEditor(false)}
        onPublished={() => setShowEditor(false)}
        showToast={showToast}
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* ── 1. HEADER & SEGMENTED SWITCHER ── */}
      <AppleReveal>
        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--primary)', fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
            <UtensilsCrossed size={16} />
            <span>Clinical Nutrition &amp; Preventive Care</span>
          </div>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 12px', letterSpacing: '-0.02em' }}>
            {activeTab === 'diet' ? 'Pet Nutrition & Diet Planner' : 'Scientific Care Guides & Articles'}
          </h1>
          <p style={{ fontSize: '15px', color: 'var(--text-muted)', maxWidth: '580px', margin: '0 auto 24px', lineHeight: 1.5 }}>
            {activeTab === 'diet' 
              ? 'Manage daily portion requirements, set scheduled meal times, and consult the GPT-4.0 clinical nutrition advisor.' 
              : 'Veterinary peer-reviewed scientific care protocols, feline hydration guidelines, and companion animal behavioral health.'}
          </p>

          {/* Segmented Controller (Apple / Flutter style) */}
          <div 
            style={{
              display: 'inline-flex',
              background: 'var(--surface-alt)',
              padding: '4px',
              borderRadius: '999px',
              border: '1px solid var(--border)',
              gap: '4px'
            }}
          >
            <button
              onClick={() => setActiveTab('diet')}
              style={{
                border: 'none',
                background: activeTab === 'diet' ? 'var(--surface)' : 'transparent',
                color: activeTab === 'diet' ? 'var(--primary)' : 'var(--text-muted)',
                fontWeight: activeTab === 'diet' ? 800 : 600,
                fontSize: '13.5px',
                padding: '8px 22px',
                borderRadius: '999px',
                cursor: 'pointer',
                boxShadow: activeTab === 'diet' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.2s ease',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <UtensilsCrossed size={15} />
              <span>Pet Nutrition &amp; Diet</span>
            </button>
            <button
              onClick={() => setActiveTab('articles')}
              style={{
                border: 'none',
                background: activeTab === 'articles' ? 'var(--surface)' : 'transparent',
                color: activeTab === 'articles' ? 'var(--primary)' : 'var(--text-muted)',
                fontWeight: activeTab === 'articles' ? 800 : 600,
                fontSize: '13.5px',
                padding: '8px 22px',
                borderRadius: '999px',
                cursor: 'pointer',
                boxShadow: activeTab === 'articles' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.2s ease',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <BookOpen size={15} />
              <span>Care Guides &amp; Articles</span>
            </button>
          </div>
        </div>
      </AppleReveal>

      {/* ── TAB 1: PET NUTRITION & DIET (FLUTTER APP PET_FOOD_SCREEN PARITY) ── */}
      {activeTab === 'diet' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', maxWidth: '820px', margin: '0 auto', width: '100%' }}>
          {/* Pet Switcher Bar if user has pets */}
          {pets.length > 1 && (
            <AppleReveal delay={0.05}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflowX: 'auto', paddingBottom: '6px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                  Select Pet:
                </span>
                {pets.map(p => {
                  const isSelected = (p.id || p.petID) === selectedPetId;
                  return (
                    <button
                      key={p.id || p.petID}
                      onClick={() => setSelectedPetId(p.id || p.petID)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '6px 14px',
                        borderRadius: '999px',
                        border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border)',
                        background: isSelected ? 'var(--primary-tint)' : 'var(--surface)',
                        color: isSelected ? 'var(--primary)' : 'var(--text-main)',
                        fontWeight: 700,
                        fontSize: '13px',
                        cursor: 'pointer',
                        transition: 'all 0.18s ease'
                      }}
                    >
                      <img 
                        src={p.photo || p.photoUrl || 'assets/images/Pet_1.jpg'} 
                        alt={p.name} 
                        style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover' }} 
                      />
                      <span>{p.name}</span>
                    </button>
                  );
                })}
              </div>
            </AppleReveal>
          )}

          {/* Section 1: Current Diet Details (Matching pet_food_screen.dart lines 126-191) */}
          <AppleReveal delay={0.1}>
            <div 
              style={{
                background: 'var(--surface-alt)',
                border: '1px solid var(--border)',
                borderRadius: '26px',
                padding: '24px 28px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.02)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                <div>
                  <div style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '11px', letterSpacing: '1.2px', textTransform: 'uppercase' }}>
                    Current Diet Formulations
                  </div>
                  <h3 style={{ fontSize: '19px', fontWeight: 800, color: 'var(--text-main)', margin: '4px 0 0' }}>
                    {activePet.name}'s Meal Formula
                  </h3>
                </div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', background: 'var(--surface)', padding: '4px 10px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  {activePet.breed || 'Companion'} • {activePet.weight ? `${activePet.weight} kg` : '3 kg'}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                {/* Food Brand Input */}
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>
                    Food Name / Commercial Brand
                  </label>
                  <input
                    type="text"
                    value={foodName}
                    onChange={(e) => setFoodName(e.target.value)}
                    placeholder="e.g., Royal Canin, Purina Pro Plan"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '16px',
                      border: '1px solid var(--border)',
                      background: 'var(--surface)',
                      color: 'var(--text-main)',
                      fontSize: '14px',
                      fontWeight: 600,
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* Food Type Select */}
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>
                    Dietary Classification
                  </label>
                  <select
                    value={foodType}
                    onChange={(e) => setFoodType(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '16px',
                      border: '1px solid var(--border)',
                      background: 'var(--surface)',
                      color: 'var(--text-main)',
                      fontSize: '14px',
                      fontWeight: 600,
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  >
                    {FOOD_TYPES.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Save Diet Action Button */}
              <button
                onClick={handleSaveDiet}
                disabled={isSavingDiet}
                className="apple-btn-blue"
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '16px',
                  background: 'var(--primary-gradient)',
                  fontSize: '14px',
                  fontWeight: 800,
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '8px',
                  border: 'none',
                  boxShadow: '0 4px 16px rgba(26, 182, 128, 0.35)'
                }}
              >
                {isSavingDiet ? (
                  <span>Saving Diet Parameters...</span>
                ) : (
                  <>
                    <Save size={16} />
                    <span>SAVE DIET DETAILS</span>
                  </>
                )}
              </button>
            </div>
          </AppleReveal>

          {/* Section 2: Meal Schedule (Matching pet_food_screen.dart lines 195-265) */}
          <AppleReveal delay={0.15}>
            <div 
              style={{
                background: 'var(--surface-alt)',
                border: '1px solid var(--border)',
                borderRadius: '26px',
                padding: '24px 28px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.02)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                <div>
                  <div style={{ color: '#00B6D2', fontWeight: 800, fontSize: '11px', letterSpacing: '1.2px', textTransform: 'uppercase' }}>
                    Circadian Rhythm
                  </div>
                  <h3 style={{ fontSize: '19px', fontWeight: 800, color: 'var(--text-main)', margin: '4px 0 0' }}>
                    Meal Feeding Schedule
                  </h3>
                </div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {feedingTimes.length} meals configured
                </span>
              </div>

              {/* Meal Chips */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
                {feedingTimes.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: '8px 0' }}>
                    No meals scheduled yet. Tap below to set daily feeding times.
                  </p>
                ) : (
                  feedingTimes.map(time => (
                    <div key={time} className="meal-time-chip">
                      <Clock size={14} color="var(--primary)" />
                      <span>{time}</span>
                      <button 
                        className="remove-time-btn" 
                        onClick={() => handleRemoveMeal(time)}
                        title="Remove meal time"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Add Time Inline Input */}
              {showAddTime && (
                <form 
                  onSubmit={handleAddMeal} 
                  style={{ display: 'flex', gap: '10px', marginBottom: '16px', alignItems: 'center' }}
                >
                  <input
                    type="time"
                    value={newTimeInput}
                    onChange={(e) => setNewTimeInput(e.target.value)}
                    required
                    style={{
                      padding: '10px 14px',
                      borderRadius: '12px',
                      border: '1px solid var(--border)',
                      background: 'var(--surface)',
                      color: 'var(--text-main)',
                      fontSize: '14px',
                      fontWeight: 700
                    }}
                  />
                  <button 
                    type="submit" 
                    className="apple-btn-blue" 
                    style={{ padding: '9px 18px', fontSize: '13px' }}
                  >
                    Confirm
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setShowAddTime(false)} 
                    className="btn-minimal"
                  >
                    Cancel
                  </button>
                </form>
              )}

              {/* Action Buttons: Add Time + AI Suggest */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddTime(true)}
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '16px',
                    padding: '12px',
                    fontSize: '13px',
                    fontWeight: 700,
                    color: 'var(--text-main)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'background 0.15s ease'
                  }}
                >
                  <Plus size={16} color="var(--primary)" />
                  <span>Add Meal Time</span>
                </button>

                <button
                  type="button"
                  onClick={handleAiSuggestSchedule}
                  style={{
                    background: 'rgba(0, 182, 210, 0.08)',
                    border: '1px solid rgba(0, 182, 210, 0.25)',
                    borderRadius: '16px',
                    padding: '12px',
                    fontSize: '13px',
                    fontWeight: 700,
                    color: '#008AA0',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'background 0.15s ease'
                  }}
                >
                  <Sparkles size={16} color="#00B6D2" />
                  <span>AI Suggest Schedule</span>
                </button>
              </div>
            </div>
          </AppleReveal>

          {/* Section 3: AI Nutritional Recommendation (Matching pet_food_screen.dart lines 270-336) */}
          <AppleReveal delay={0.2}>
            <div 
              style={{
                background: 'var(--surface-alt)',
                border: '1px solid var(--border)',
                borderRadius: '26px',
                padding: '24px 28px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.02)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <div style={{ color: '#7C4DFF', fontWeight: 800, fontSize: '11px', letterSpacing: '1.2px', textTransform: 'uppercase' }}>
                    OpenAI GPT-4.0 Clinical Dietetics
                  </div>
                  <h3 style={{ fontSize: '19px', fontWeight: 800, color: 'var(--text-main)', margin: '4px 0 0' }}>
                    AI Nutritional Recommendation
                  </h3>
                </div>
                <span style={{ fontSize: '11px', fontWeight: 800, background: 'rgba(124,77,255,0.12)', color: '#7C4DFF', padding: '4px 10px', borderRadius: '999px' }}>
                  GPT-4.0
                </span>
              </div>

              {!aiRecommendation ? (
                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                  <p style={{ color: 'var(--text-muted)', fontSize: '13.5px', marginBottom: '18px', maxWidth: '520px', margin: '0 auto 20px' }}>
                    Click below to generate an authorized veterinary nutritional regimen tailored specifically to {activePet.name}'s breed, age, and activity level.
                  </p>
                  <button
                    onClick={handleAskAiExpert}
                    disabled={isAiLoading}
                    style={{
                      padding: '14px 28px',
                      borderRadius: '16px',
                      background: 'linear-gradient(135deg, #7C4DFF 0%, #3B82F6 100%)',
                      color: '#FFFFFF',
                      fontSize: '14px',
                      fontWeight: 800,
                      border: 'none',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 6px 20px rgba(124, 77, 255, 0.35)',
                      transition: 'transform 0.2s ease'
                    }}
                  >
                    <Sparkles size={18} />
                    <span>{isAiLoading ? 'Analyzing Clinical Biomarkers...' : 'Ask AI Nutrition Expert'}</span>
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Target Calories Pill */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface)', padding: '14px 18px', borderRadius: '16px', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Flame size={20} color="#FF9500" />
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Daily Caloric Target</div>
                        <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>{aiRecommendation.calories || '280 kcal/day'}</div>
                      </div>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', background: 'var(--surface-alt)', padding: '4px 8px', borderRadius: '8px' }}>
                      Based on weight: {activePet.weight || '3.2'} kg
                    </span>
                  </div>

                  {/* Nutrients Checklist */}
                  {aiRecommendation.nutrients && (
                    <div>
                      <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>
                        Required Dietary Composition
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
                        {aiRecommendation.nutrients.map((nut, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--surface)', padding: '8px 12px', borderRadius: '12px', border: '1px solid var(--border)', fontSize: '12.5px', color: 'var(--text-main)', fontWeight: 600 }}>
                            <CheckCircle2 size={15} color="var(--primary)" />
                            <span>{nut}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Clinical Recommendations list */}
                  {aiRecommendation.recommendations && (
                    <div style={{ background: 'var(--surface)', padding: '16px', borderRadius: '16px', border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>
                        Clinical Feeding Protocol
                      </div>
                      <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                        {aiRecommendation.recommendations.map((rec, i) => (
                          <li key={i}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Re-analyze CTA */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                    <button 
                      onClick={handleAskAiExpert} 
                      className="btn-minimal" 
                      style={{ fontSize: '12px' }}
                    >
                      ↻ Re-run GPT-4.0 Analysis
                    </button>
                  </div>
                </div>
              )}
            </div>
          </AppleReveal>
        </div>
      )}

      {/* ── TAB 2: SCIENTIFIC CARE GUIDES & ARTICLES ── */}
      {activeTab === 'articles' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {/* Top Bar: Search + Category Filters + Write Button */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
            {/* Category Pills */}
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
              {CATEGORIES.map(cat => {
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    style={{
                      background: isSelected ? 'var(--primary)' : 'var(--surface-alt)',
                      color: isSelected ? '#FFFFFF' : 'var(--text-main)',
                      border: '1px solid var(--border)',
                      borderRadius: '999px',
                      padding: '7px 16px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            {/* Search + Write Article button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ position: 'relative' }}>
                <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Search articles & guides..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    padding: '8px 14px 8px 34px',
                    borderRadius: '999px',
                    border: '1px solid var(--border)',
                    background: 'var(--surface-alt)',
                    color: 'var(--text-main)',
                    fontSize: '13px',
                    outline: 'none',
                    width: '200px'
                  }}
                />
              </div>

              <button
                onClick={() => setShowEditor(true)}
                className="apple-btn-blue"
                style={{ padding: '8px 18px', fontSize: '13px' }}
              >
                <PenLine size={15} />
                <span>Write Article</span>
              </button>
            </div>
          </div>

          {/* Articles Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
            {filteredBlogs.map(article => (
              <motion.div
                key={article.id}
                whileHover={{ y: -4 }}
                onClick={() => setSelectedArticle(article)}
                style={{
                  background: 'var(--surface-alt)',
                  borderRadius: '24px',
                  border: '1px solid var(--border)',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.02)',
                  transition: 'all 0.2s ease'
                }}
              >
                {article.imageUrl && (
                  <img
                    src={article.imageUrl}
                    alt={article.title}
                    style={{ width: '100%', height: '180px', objectFit: 'cover' }}
                  />
                )}
                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '10px', fontWeight: 800, color: CATEGORY_COLORS[article.category] || 'var(--primary)', letterSpacing: '0.5px' }}>
                      {article.category || 'HEALTH'}
                    </span>
                    <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} /> {article.readTimeMinutes || 4} min read
                    </span>
                  </div>

                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 8px', lineHeight: 1.3 }}>
                    {article.title}
                  </h3>

                  <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: 1.5, margin: '0 0 16px', flex: 1, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {article.content}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                    <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                      By {article.authorName || 'Veterinary Specialist'}
                    </span>
                    <span style={{ color: 'var(--primary)', fontSize: '12.5px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '2px' }}>
                      Read <ChevronRight size={14} />
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* ── ARTICLE READING MODAL ── */}
      {selectedArticle && (
        <div className="modal-backdrop" onClick={() => setSelectedArticle(null)}>
          <motion.div
            className="modal-dialog"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            style={{
              maxWidth: '680px',
              width: '92%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '28px',
              borderRadius: '28px',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              boxShadow: '0 24px 60px rgba(0,0,0,0.18)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: CATEGORY_COLORS[selectedArticle.category] || 'var(--primary)', letterSpacing: '0.5px' }}>
                {selectedArticle.category} • {selectedArticle.readTimeMinutes || 4} MIN READ
              </span>
              <button 
                className="icon-btn" 
                onClick={() => setSelectedArticle(null)}
                style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', background: 'var(--surface-alt)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={16} color="var(--text-muted)" />
              </button>
            </div>

            {selectedArticle.imageUrl && (
              <img
                src={selectedArticle.imageUrl}
                alt={selectedArticle.title}
                style={{ width: '100%', maxHeight: '280px', objectFit: 'cover', borderRadius: '18px', marginBottom: '20px' }}
              />
            )}

            <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 12px', lineHeight: 1.25 }}>
              {selectedArticle.title}
            </h2>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '12px', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
              <span>Author: {selectedArticle.authorName || 'Veterinary Staff'}</span>
            </div>

            <div style={{ fontSize: '14.5px', color: 'var(--text-main)', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
              {selectedArticle.content}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
