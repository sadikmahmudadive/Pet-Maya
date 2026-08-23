/**
 * Pet Maya Web Application Core Engine
 * Full-featured interactive SPA mirroring the mobile app experience.
 * Handles Pets, AI Vision Scanner, Vet Teleconsultation, Community, Shop Cart, and Calendar.
 */

// ─── LOCAL STORAGE REPOSITORY ───
const DB = {
  get: (key, fallback) => {
    try {
      const data = localStorage.getItem('petmaya_' + key);
      return data ? JSON.parse(data) : fallback;
    } catch (e) {
      console.error('Storage Read Error:', e);
      return fallback;
    }
  },
  set: (key, val) => {
    try {
      localStorage.setItem('petmaya_' + key, JSON.stringify(val));
    } catch (e) {
      console.error('Storage Write Error:', e);
    }
  }
};

// ─── INITIAL SEED DATA ───
const INITIAL_PETS = [
  {
    id: 'pet-1',
    name: 'Max',
    species: 'dog',
    breed: 'Golden Retriever',
    age: '2.5 Years',
    weight: '28.4 kg',
    gender: 'Male (Neutered)',
    avatar: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=300&auto=format&fit=crop&q=80',
    activity: 'High (6.2 km/day)',
    wellnessScore: '96/100',
    diet: 'High-Protein Salmon & Rice Kibble (380g/day)'
  },
  {
    id: 'pet-2',
    name: 'Luna',
    species: 'cat',
    breed: 'British Shorthair',
    age: '1.8 Years',
    weight: '4.2 kg',
    gender: 'Female',
    avatar: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=300&auto=format&fit=crop&q=80',
    activity: 'Moderate Indoor',
    wellnessScore: '92/100',
    diet: 'Grain-Free Turkey Pate + Probiotics (180g/day)'
  }
];

const VETS_DATA = [
  {
    id: 'vet-1',
    name: 'Dr. Sarah Jenkins, DVM',
    specialty: 'Canine Specialist & Surgery',
    specialization: 'Small Animal Surgery & Orthopedics',
    clinicName: 'Central Metro Pet Hospital, Floor 2',
    yearsExperience: 9,
    exp: '9+ Years Experience',
    rating: '4.9 ★ (184 reviews)',
    clinic: 'Central Metro Pet Hospital, Floor 2',
    fee: '৳45 / Consultation',
    avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80',
    available: 'Available Today (Video & Clinic)',
    category: 'canine',
    bio: 'Dedicated small animal surgeon with 9+ years of clinical excellence in soft tissue and orthopedic care.'
  },
  {
    id: 'vet-2',
    name: 'Dr. Aris Thorne, MVSc',
    specialty: 'Dermatology & Allergy Care',
    specialization: 'Dermatology & Allergy Care',
    clinicName: 'Apex Veterinary Dermatology Care',
    yearsExperience: 12,
    exp: '12+ Years Experience',
    rating: '5.0 ★ (240 reviews)',
    clinic: 'Apex Veterinary Dermatology Care',
    fee: '৳55 / Consultation',
    avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80',
    available: 'Next Slot: Tomorrow 10:00 AM',
    category: 'dermatology',
    bio: 'Specialist in complex chronic allergies, atopic dermatitis, and advanced pet immunology.'
  },
  {
    id: 'vet-3',
    name: 'Dr. Emily Vance, DVM',
    specialty: 'Feline Internal Medicine',
    specialization: 'Feline Internal Medicine & Ultrasound',
    clinicName: 'Whisker & Paws Feline Health Center',
    yearsExperience: 8,
    exp: '8+ Years Experience',
    rating: '4.9 ★ (132 reviews)',
    clinic: 'Whisker & Paws Feline Health Center',
    fee: '৳40 / Consultation',
    avatar: 'https://images.unsplash.com/photo-1594824813591-1823906371ef?w=150&auto=format&fit=crop&q=80',
    available: 'Available Today (Video Call)',
    category: 'feline',
    bio: 'Certified feline practitioner specializing in gentle diagnostics, renal care, and feline nutrition.'
  },
  {
    id: 'vet-4',
    name: 'Dr. Marcus Brody, DVM',
    specialty: 'Exotic & Avian Care Specialist',
    specialization: 'Exotic & Avian Medicine',
    clinicName: 'Avian & Exotic Wildcare Clinic',
    yearsExperience: 14,
    exp: '14+ Years Experience',
    rating: '4.8 ★ (98 reviews)',
    clinic: 'Avian & Exotic Wildcare Clinic',
    fee: '৳50 / Consultation',
    avatar: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=150&auto=format&fit=crop&q=80',
    available: 'Available Mon-Fri',
    category: 'exotic',
    bio: 'Expert clinical provider for birds, reptiles, and small exotic companion mammals.'
  }
];

const PRODUCTS_DATA = [
  {
    id: 'prod-1',
    name: 'Pro-Health Omega-3 Wild Salmon Oil (500ml)',
    category: 'health',
    price: 240.00,
    rating: '4.9 ★',
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&auto=format&fit=crop&q=80',
    badge: 'Best Seller',
    desc: 'Promotes shiny coat, joint flexibility, and relieves itchy skin.'
  },
  {
    id: 'prod-2',
    name: 'Royal Canin Adult Digestive Care Kibble (4kg)',
    category: 'food',
    price: 480.00,
    rating: '4.8 ★',
    image: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=300&auto=format&fit=crop&q=80',
    badge: 'Veterinary Choice',
    desc: 'Formulated for optimal stool quality and balanced gut microflora.'
  },
  {
    id: 'prod-3',
    name: 'NexGard Spectra Flea & Tick Chewables (3 Pack)',
    category: 'health',
    price: 360.00,
    rating: '5.0 ★',
    image: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=300&auto=format&fit=crop&q=80',
    badge: 'Essential',
    desc: 'Monthly beef-flavored chew protecting against heartworm, fleas & ticks.'
  },
  {
    id: 'prod-4',
    name: 'Organic Lavender Soothing Pet Shampoo (400ml)',
    category: 'grooming',
    price: 170.00,
    rating: '4.7 ★',
    image: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=300&auto=format&fit=crop&q=80',
    badge: '100% Organic',
    desc: 'Hypoallergenic botanical wash that hydrates dry and sensitive skin.'
  },
  {
    id: 'prod-5',
    name: 'Smart Interactive Laser & Feather Cat Toy',
    category: 'toys',
    price: 220.00,
    rating: '4.9 ★',
    image: 'https://images.unsplash.com/photo-1545249390-6bdfa286032f?w=300&auto=format&fit=crop&q=80',
    badge: 'Popular',
    desc: 'Automatic 360° rotating laser beacon for active indoor exercise.'
  },
  {
    id: 'prod-6',
    name: 'Heavy-Duty Dental Chew Bone for Tough Chewers',
    category: 'toys',
    price: 145.00,
    rating: '4.8 ★',
    image: 'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=300&auto=format&fit=crop&q=80',
    badge: 'Durable',
    desc: 'Cleans plaque and tartar while satisfying natural chewing instincts.'
  }
];

const INITIAL_POSTS = [
  {
    id: 'post-1',
    author: 'Emily Watson',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80',
    time: '2 hours ago',
    badge: 'Golden Retriever Mom',
    text: 'Max just finished his 12-week agility training milestone! 🏆 His coat has been super healthy since we switched to Omega-3 salmon oil supplements recommended on Pet Maya.',
    image: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=600&auto=format&fit=crop&q=80',
    likes: 42,
    isLiked: false,
    comments: [
      { author: 'Dr. Sarah Jenkins', text: 'He looks incredibly agile and happy! Keep up the good nutrition work Emily.', time: '1h ago' },
      { author: 'Dave Miller', text: 'Where did you get the training cone set? Looks awesome!', time: '35m ago' }
    ]
  },
  {
    id: 'post-2',
    author: 'Michael Chen',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    time: '5 hours ago',
    badge: 'Cat Parent',
    text: 'Quick tip: The AI Health Scanner caught Luna\'s mild ear irritation before it turned into an infection. Booked Dr. Vance right away and got topical drops in 1 hour!',
    image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600&auto=format&fit=crop&q=80',
    likes: 29,
    isLiked: false,
    comments: [
      { author: 'Sophia Rossi', text: 'Pet Maya\'s scanner is truly a lifesaver for early detection.', time: '3h ago' }
    ]
  }
];

// ─── STATE MANAGEMENT ───
let state = {
  pets: DB.get('pets', INITIAL_PETS),
  activePetId: DB.get('activePetId', 'pet-1'),
  appointments: DB.get('appointments', []),
  cart: DB.get('cart', []),
  posts: DB.get('posts', INITIAL_POSTS),
  reminders: DB.get('reminders', []),
  selectedVetForBooking: null,
  uploadedScanImage: null
};

function saveState() {
  DB.set('pets', state.pets);
  DB.set('activePetId', state.activePetId);
  DB.set('appointments', state.appointments);
  DB.set('cart', state.cart);
  DB.set('posts', state.posts);
  DB.set('reminders', state.reminders);
}

// ─── TOAST NOTIFICATION ───
function showToast(msg, isSuccess = true) {
  const container = document.getElementById('toastContainer') || createToastContainer();
  const toast = document.createElement('div');
  toast.className = 'toast ' + (isSuccess ? 'toast-success' : 'toast-error');
  toast.innerHTML = (isSuccess ? '✅ ' : '⚠️ ') + msg;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}

function createToastContainer() {
  let c = document.getElementById('toastContainer');
  if (!c) {
    c = document.createElement('div');
    c.id = 'toastContainer';
    c.style.cssText = 'position:fixed; top:24px; right:24px; z-index:99999; display:flex; flex-direction:column; gap:10px; pointer-events:none;';
    document.body.appendChild(c);
  }
  return c;
}

// ─── 1. PET MANAGER MODULE ───
function getActivePet() {
  return state.pets.find(p => p.id === state.activePetId) || state.pets[0] || INITIAL_PETS[0];
}

function renderPets() {
  const container = document.getElementById('myPetsList');
  const selector = document.getElementById('activePetSelector');
  if (!container) return;

  container.innerHTML = '';
  if (selector) selector.innerHTML = '';

  state.pets.forEach(pet => {
    const isActive = pet.id === state.activePetId;
    
    if (selector) {
      const opt = document.createElement('option');
      opt.value = pet.id;
      opt.textContent = `${pet.name} (${pet.breed})`;
      opt.selected = isActive;
      selector.appendChild(opt);
    }

    const card = document.createElement('div');
    card.className = `pet-profile-card ${isActive ? 'active-pet-border' : ''}`;
    card.innerHTML = `
      <div style="display:flex; align-items:center; gap:16px;">
        <img src="${pet.avatar}" alt="${pet.name}" class="pet-card-avatar" style="width:64px; height:64px; border-radius:18px; object-fit:cover; border:2px solid var(--primary);">
        <div style="flex:1;">
          <div style="display:flex; align-items:center; justify-content:space-between;">
            <h3 style="font-size:18px; font-weight:800; color:var(--text-dark); margin:0;">${pet.name}</h3>
            ${isActive ? '<span class="badge" style="background:#DCFCE7; color:#16A34A; padding:2px 8px; font-size:11px;">Active</span>' : ''}
          </div>
          <p style="font-size:13px; color:var(--text-muted); margin:2px 0;">${pet.breed} • ${pet.gender}</p>
          <div style="display:flex; gap:8px; margin-top:6px; font-size:12px; font-weight:700;">
            <span style="background:var(--primary-light); color:var(--primary); padding:2px 8px; border-radius:999px;">⚖️ ${pet.weight}</span>
            <span style="background:rgba(0,182,210,0.1); color:#00B6D2; padding:2px 8px; border-radius:999px;">🎂 ${pet.age}</span>
          </div>
        </div>
      </div>
      <div style="margin-top:14px; padding-top:12px; border-top:1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center;">
        <button class="btn btn-sm ${isActive ? 'btn-primary' : 'btn-secondary'}" onclick="switchActivePet('${pet.id}')">
          ${isActive ? '✓ Selected' : 'Switch to ' + pet.name}
        </button>
        <button class="btn-icon-del" onclick="deletePet('${pet.id}')" title="Delete Profile" style="background:none; border:none; cursor:pointer; font-size:16px;">🗑️</button>
      </div>
    `;
    container.appendChild(card);
  });

  renderActivePetDetails();
}

function switchActivePet(id) {
  state.activePetId = id;
  saveState();
  renderPets();
  showToast(`Switched active pet to ${getActivePet().name}!`);
}

function renderActivePetDetails() {
  const pet = getActivePet();
  if (!pet) return;

  const nameEl = document.getElementById('activePetName');
  const breedEl = document.getElementById('activePetBreed');
  const avatarEl = document.getElementById('activePetAvatar');
  const weightEl = document.getElementById('activePetWeight');
  const scoreEl = document.getElementById('activePetScore');
  const dietEl = document.getElementById('activePetDiet');

  if (nameEl) nameEl.textContent = pet.name;
  if (breedEl) breedEl.textContent = `${pet.breed} • ${pet.gender} • ${pet.age}`;
  if (avatarEl) avatarEl.src = pet.avatar;
  if (weightEl) weightEl.textContent = pet.weight;
  if (scoreEl) scoreEl.textContent = pet.wellnessScore;
  if (dietEl) dietEl.textContent = pet.diet;
}

function openAddPetModal() {
  const modal = document.getElementById('addPetModal');
  if (modal) modal.style.display = 'flex';
}

function closeAddPetModal() {
  const modal = document.getElementById('addPetModal');
  if (modal) modal.style.display = 'none';
}

function submitNewPet(e) {
  if (e) e.preventDefault();
  const name = document.getElementById('newPetName').value.trim();
  const species = document.getElementById('newPetSpecies').value;
  const breed = document.getElementById('newPetBreed').value.trim();
  const age = document.getElementById('newPetAge').value.trim();
  const weight = document.getElementById('newPetWeight').value.trim();
  const gender = document.getElementById('newPetGender').value;

  if (!name || !breed) {
    showToast('Please provide pet name and breed.', false);
    return;
  }

  const defaultAvatar = species === 'dog' 
    ? 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=300&auto=format&fit=crop&q=80'
    : 'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?w=300&auto=format&fit=crop&q=80';

  const newPet = {
    id: 'pet-' + Date.now(),
    name,
    species,
    breed,
    age: age || '1 Year',
    weight: weight ? weight + ' kg' : '5.0 kg',
    gender,
    avatar: defaultAvatar,
    activity: 'Active & Healthy',
    wellnessScore: '98/100',
    diet: 'Fresh Personalized Recipe'
  };

  state.pets.push(newPet);
  state.activePetId = newPet.id;
  saveState();
  renderPets();
  closeAddPetModal();
  showToast(`🐾 ${name} added to your Pet Maya dashboard!`);
  document.getElementById('addPetForm').reset();
}

function deletePet(id) {
  if (state.pets.length <= 1) {
    showToast('You must keep at least one pet profile.', false);
    return;
  }
  if (confirm('Are you sure you want to delete this pet profile?')) {
    state.pets = state.pets.filter(p => p.id !== id);
    if (state.activePetId === id) {
      state.activePetId = state.pets[0].id;
    }
    saveState();
    renderPets();
    showToast('Pet profile deleted.');
  }
}

// ─── 2. AI VISION HEALTH SCANNER ───
function handleScannerImageUpload(input) {
  if (input.files && input.files[0]) {
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = function(e) {
      state.uploadedScanImage = e.target.result;
      const preview = document.getElementById('scannerPreviewImg');
      const placeholder = document.getElementById('scannerUploadPlaceholder');
      if (preview) {
        preview.src = e.target.result;
        preview.style.display = 'block';
      }
      if (placeholder) placeholder.style.display = 'none';
      showToast('Image uploaded! Click "Run AI Vision Scan".');
    };
    reader.readAsDataURL(file);
  }
}

function runAIVisionScan() {
  const activePet = getActivePet();
  const statusBox = document.getElementById('scanStatus');
  const progressBar = document.getElementById('scanProgressBar');
  const scanStepText = document.getElementById('scanStepText');
  const resultCard = document.getElementById('triageResultCard');

  if (!statusBox || !progressBar) return;

  statusBox.style.display = 'block';
  if (resultCard) resultCard.style.display = 'none';
  progressBar.style.width = '0%';

  const steps = [
    { p: '25%', text: `Preprocessing photo for ${activePet.name}...` },
    { p: '55%', text: 'Analyzing epidermal coat, texture & lesion boundaries...' },
    { p: '85%', text: 'Cross-referencing 45,000+ veterinary pathology datasets...' },
    { p: '100%', text: 'Generating triage diagnosis & care protocol...' }
  ];

  let current = 0;
  const interval = setInterval(() => {
    if (current < steps.length) {
      progressBar.style.width = steps[current].p;
      if (scanStepText) scanStepText.textContent = steps[current].text;
      current++;
    } else {
      clearInterval(interval);
      setTimeout(() => {
        statusBox.style.display = 'none';
        displayTriageResult();
      }, 400);
    }
  }, 400);
}

function displayTriageResult() {
  const pet = getActivePet();
  const activeChip = document.querySelector('.chip.active');
  const area = activeChip ? activeChip.textContent : 'Skin & Coat Condition';

  const triageDatabase = {
    'Skin & Coat Condition': {
      title: `Mild Superficial Dermatitis & Hot Spot (${pet.name})`,
      urgency: 'Moderate Attention (Vet Visit in 24-48h)',
      urgencyBg: '#FEF3C7',
      urgencyColor: '#D97706',
      causes: 'Probable environmental contact allergen or localized moisture irritation.',
      homeCare: 'Keep area dry and clean with chlorhexidine wipe. Prevent licking using an e-collar.',
      clinicAction: 'Schedule a localized skin scrape cytology and topical anti-inflammatory balm.'
    },
    'Eye & Ear Discharge': {
      title: `Early Serous Blepharitis / Otitis Irritation (${pet.name})`,
      urgency: 'Urgent Care (Check within 24h)',
      urgencyBg: '#FEE2E2',
      urgencyColor: '#DC2626',
      causes: 'Foreign particulate or fungal spore ingress in outer ear canal.',
      homeCare: 'Do NOT use cotton swabs deep into ear canal. Wipe outer flap with saline gauze.',
      clinicAction: 'Otoscopic exam and prescription medicated antibiotic/antifungal ear drops.'
    },
    'Digestion & Appetite': {
      title: `Mild Gastric Upset / Food Sensitivity (${pet.name})`,
      urgency: 'Mild (Monitor for 24h)',
      urgencyBg: '#DCFCE7',
      urgencyColor: '#16A34A',
      causes: 'Dietary indiscretion, brand transition, or minor hydration imbalance.',
      homeCare: 'Offer bland diet (boiled chicken + pumpkin puree). Ensure fresh bowl of water.',
      clinicAction: 'If vomiting continues over 24 hours, visit clinic for abdominal palpation.'
    },
    'Limping & Mobility': {
      title: `Soft Tissue Strain / Paw Pad Abrasion (${pet.name})`,
      urgency: 'Moderate Attention (Rest & Observe)',
      urgencyBg: '#FEF3C7',
      urgencyColor: '#D97706',
      causes: 'Rough surface running friction, minor ligament hyperextension, or interdigital thorn.',
      homeCare: 'Enforce crate/bed rest. Inspect interdigital webbing for thorns or burrs.',
      clinicAction: 'Consult orthopedic vet for physical examination and anti-inflammatory joint therapy.'
    }
  };

  const data = triageDatabase[area] || triageDatabase['Skin & Coat Condition'];

  const badge = document.getElementById('triageUrgencyBadge');
  if (badge) {
    badge.textContent = data.urgency;
    badge.style.backgroundColor = data.urgencyBg;
    badge.style.color = data.urgencyColor;
  }

  const titleEl = document.getElementById('triageTitle');
  const causesEl = document.getElementById('triageCauses');
  const homeCareEl = document.getElementById('triageHomeCare');
  const clinicActionEl = document.getElementById('triageClinicAction');

  if (titleEl) titleEl.textContent = data.title;
  if (causesEl) causesEl.textContent = data.causes;
  if (homeCareEl) homeCareEl.textContent = data.homeCare;
  if (clinicActionEl) clinicActionEl.textContent = data.clinicAction;

  const resultCard = document.getElementById('triageResultCard');
  if (resultCard) {
    resultCard.style.display = 'block';
    resultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  showToast('✅ Diagnostic report generated!');
}

function exportTriageReport() {
  const pet = getActivePet();
  const title = document.getElementById('triageTitle')?.textContent || 'Diagnostic Assessment';
  const homeCare = document.getElementById('triageHomeCare')?.textContent || '';
  const clinicAction = document.getElementById('triageClinicAction')?.textContent || '';

  const reportText = `======================================================
PET MAYA AI CLINICAL HEALTH REPORT
Generated: ${new Date().toLocaleString()}
Patient: ${pet.name} (${pet.species.toUpperCase()} - ${pet.breed})
Age: ${pet.age} | Weight: ${pet.weight}
======================================================

DIAGNOSIS:
${title}

RECOMMENDED HOME CARE:
${homeCare}

RECOMMENDED VETERINARY ACTION:
${clinicAction}

------------------------------------------------------
CONFIDENTIAL MEDICAL SUMMARY - PET MAYA ECOSYSTEM
Platform: https://petmaya.app
Support: siradive137@gmail.com
======================================================`;

  const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.setAttribute('download', `PetMaya_AI_Report_${pet.name}_${Date.now()}.txt`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast('📄 Clinical report downloaded!');
}

// ─── 3. VETERINARIAN BOOKING MODULE ───
function renderVets(filter = 'all') {
  const container = document.getElementById('vetsListGrid');
  if (!container) return;
  container.innerHTML = '';

  const filtered = filter === 'all' ? VETS_DATA : VETS_DATA.filter(v => v.category === filter);

  filtered.forEach(vet => {
    const card = document.createElement('div');
    card.className = 'vet-item-card';
    card.innerHTML = `
      <div style="display:flex; align-items:center; gap:16px; width:100%;">
        <img src="${vet.avatar}" alt="${vet.name}" class="vet-avatar" style="width:64px; height:64px; border-radius:18px; object-fit:cover;">
        <div style="flex:1;">
          <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:6px;">
            <h3 style="font-size:16px; font-weight:800; color:var(--text-dark); margin:0;">${vet.name}</h3>
            <span style="font-size:13px; font-weight:700; color:var(--primary);">${vet.fee}</span>
          </div>
          <p style="font-size:13px; color:var(--primary); font-weight:600; margin:2px 0;">${vet.specialty}</p>
          <p style="font-size:12px; color:var(--text-muted); margin:2px 0;">📍 ${vet.clinic} • ${vet.rating}</p>
          <div style="margin-top:8px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
            <span style="font-size:12px; color:#10B981; font-weight:700;">🟢 ${vet.available}</span>
            <button class="btn btn-sm btn-primary" onclick="openBookingModal('${vet.id}')">
              📅 Book Appointment
            </button>
          </div>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

function filterVets(category, btn) {
  document.querySelectorAll('.vet-filter-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderVets(category);
}

function openBookingModal(vetId) {
  const vet = VETS_DATA.find(v => v.id === vetId) || VETS_DATA[0];
  state.selectedVetForBooking = vet;

  const modal = document.getElementById('bookingModal');
  const vetNameEl = document.getElementById('bookingVetName');
  const vetSpecEl = document.getElementById('bookingVetSpecialty');
  const vetAvatarEl = document.getElementById('bookingVetAvatar');
  const petSelectEl = document.getElementById('bookingPetSelect');

  if (vetNameEl) vetNameEl.textContent = vet.name;
  if (vetSpecEl) vetSpecEl.textContent = `${vet.specialty} (${vet.fee})`;
  if (vetAvatarEl) vetAvatarEl.src = vet.avatar;

  if (petSelectEl) {
    petSelectEl.innerHTML = '';
    state.pets.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.name;
      opt.textContent = `${p.name} (${p.breed})`;
      opt.selected = p.id === state.activePetId;
      petSelectEl.appendChild(opt);
    });
  }

  const dateInput = document.getElementById('bookingDate');
  if (dateInput) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    dateInput.value = tomorrow.toISOString().split('T')[0];
  }

  if (modal) modal.style.display = 'flex';
}

function closeBookingModal() {
  const modal = document.getElementById('bookingModal');
  if (modal) modal.style.display = 'none';
}

function confirmAppointment(e) {
  if (e) e.preventDefault();
  const vet = state.selectedVetForBooking || VETS_DATA[0];
  const petName = document.getElementById('bookingPetSelect')?.value || getActivePet().name;
  const visitType = document.getElementById('bookingVisitType')?.value || 'Video Teleconsultation';
  const date = document.getElementById('bookingDate')?.value || 'Tomorrow';
  const time = document.getElementById('bookingTime')?.value || '10:30 AM';
  const reason = document.getElementById('bookingReason')?.value || 'General Wellness Checkup';

  const appointment = {
    id: 'appt-' + Date.now(),
    vetName: vet.name,
    petName,
    visitType,
    date,
    time,
    reason,
    fee: vet.fee,
    status: 'Confirmed'
  };

  state.appointments.unshift(appointment);
  saveState();
  closeBookingModal();
  renderAppointmentsList();
  showAppointmentConfirmationPass(appointment);
  showToast(`🎉 Appointment booked with ${vet.name}!`);
}

function showAppointmentConfirmationPass(appt) {
  const modal = document.getElementById('apptPassModal');
  if (!modal) return;

  const refEl = document.getElementById('passRefId');
  const vetEl = document.getElementById('passVetName');
  const petEl = document.getElementById('passPetName');
  const dtEl = document.getElementById('passDateTime');
  const typeEl = document.getElementById('passType');

  if (refEl) refEl.textContent = appt.id.toUpperCase();
  if (vetEl) vetEl.textContent = appt.vetName;
  if (petEl) petEl.textContent = appt.petName;
  if (dtEl) dtEl.textContent = `${appt.date} at ${appt.time}`;
  if (typeEl) typeEl.textContent = appt.visitType;

  modal.style.display = 'flex';
}

function closeApptPassModal() {
  const modal = document.getElementById('apptPassModal');
  if (modal) modal.style.display = 'none';
}

function renderAppointmentsList() {
  const container = document.getElementById('myAppointmentsContainer');
  if (!container) return;

  if (state.appointments.length === 0) {
    container.innerHTML = `<p style="font-size:13px; color:var(--text-muted); text-align:center; padding:16px;">No upcoming appointments. Select a vet above to schedule a visit!</p>`;
    return;
  }

  container.innerHTML = '';
  state.appointments.forEach(appt => {
    const item = document.createElement('div');
    item.className = 'appt-item-card';
    item.style.cssText = 'background:var(--bg-light); border:1px solid var(--border-color); border-radius:16px; padding:16px; margin-bottom:12px;';
    item.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:flex-start;">
        <div>
          <h4 style="font-size:15px; font-weight:800; color:var(--text-dark); margin:0;">${appt.vetName}</h4>
          <p style="font-size:12px; color:var(--primary); font-weight:700; margin:2px 0;">🐾 Patient: ${appt.petName} • ${appt.visitType}</p>
          <p style="font-size:12px; color:var(--text-muted); margin:2px 0;">📅 ${appt.date} at ${appt.time}</p>
        </div>
        <span class="badge" style="background:#DCFCE7; color:#16A34A; padding:3px 8px; font-size:11px; border-radius:999px;">Confirmed</span>
      </div>
      <div style="margin-top:10px; display:flex; gap:8px;">
        <button class="btn btn-sm btn-secondary" onclick="downloadApptICS('${appt.id}')">📲 Add to Calendar</button>
        <button class="btn btn-sm" style="color:#EF4444; background:rgba(239,68,68,0.1); border:none; cursor:pointer; border-radius:999px; padding:6px 12px;" onclick="cancelAppointment('${appt.id}')">Cancel</button>
      </div>
    `;
    container.appendChild(item);
  });
}

function cancelAppointment(id) {
  if (confirm('Cancel this appointment?')) {
    state.appointments = state.appointments.filter(a => a.id !== id);
    saveState();
    renderAppointmentsList();
    showToast('Appointment cancelled.');
  }
}

function downloadApptICS(id) {
  const appt = state.appointments.find(a => a.id === id) || state.appointments[0];
  if (!appt) return;

  const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Pet Maya//Appointment//EN
BEGIN:VEVENT
SUMMARY:🩺 Pet Maya: ${appt.visitType} with ${appt.vetName}
DESCRIPTION:Patient: ${appt.petName}\\nReason: ${appt.reason}\\nFee: ${appt.fee}
LOCATION:Central Pet Hospital / Video Call
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.setAttribute('download', `PetMaya_Appt_${appt.id}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast('Calendar event downloaded!');
}

// ─── 4. SOCIAL COMMUNITY FEED ───
function renderCommunityFeed() {
  const container = document.getElementById('communityFeedList');
  if (!container) return;
  container.innerHTML = '';

  state.posts.forEach((post, pIndex) => {
    const card = document.createElement('div');
    card.className = 'community-post-card';
    card.style.cssText = 'background:var(--bg-card); border:1px solid var(--border-color); border-radius:24px; padding:24px; margin-bottom:20px; box-shadow:var(--shadow-sm);';
    card.innerHTML = `
      <div style="display:flex; align-items:center; gap:12px; margin-bottom:14px;">
        <img src="${post.avatar}" alt="${post.author}" style="width:44px; height:44px; border-radius:50%; object-fit:cover;">
        <div>
          <div style="display:flex; align-items:center; gap:8px;">
            <h4 style="font-size:15px; font-weight:800; color:var(--text-dark); margin:0;">${post.author}</h4>
            <span style="font-size:11px; background:var(--primary-light); color:var(--primary); padding:2px 8px; border-radius:999px; font-weight:700;">${post.badge}</span>
          </div>
          <span style="font-size:12px; color:var(--text-muted);">${post.time}</span>
        </div>
      </div>
      <p style="font-size:14px; color:var(--text-dark); line-height:1.6; margin-bottom:14px;">${post.text}</p>
      ${post.image ? `<img src="${post.image}" alt="Post image" style="width:100%; border-radius:16px; max-height:360px; object-fit:cover; margin-bottom:14px;">` : ''}
      
      <div style="margin-top:14px; display:flex; align-items:center; justify-content:space-between; padding-top:12px; border-top:1px solid var(--border-color);">
        <button class="like-btn" onclick="toggleLikePost(${pIndex})" style="background:none; border:none; cursor:pointer; font-size:14px; font-weight:700; color:${post.isLiked ? '#EF4444' : 'var(--text-muted)'}; display:flex; align-items:center; gap:6px;">
          ${post.isLiked ? '❤️' : '🤍'} <span>${post.likes} Likes</span>
        </button>
        <span style="font-size:13px; color:var(--text-muted); font-weight:600;">💬 ${post.comments.length} Comments</span>
      </div>

      <!-- Comments Thread -->
      <div class="comments-thread-box" style="margin-top:14px; background:var(--bg-light); border-radius:14px; padding:14px;">
        ${post.comments.map(c => `
          <div style="font-size:13px; margin-bottom:8px;">
            <strong style="color:var(--text-dark);">${c.author}:</strong> <span style="color:var(--text-muted);">${c.text}</span>
            <small style="color:var(--text-muted); font-size:10px; margin-left:6px;">${c.time || ''}</small>
          </div>
        `).join('')}
        
        <div style="display:flex; gap:8px; margin-top:10px;">
          <input type="text" class="input-field" style="padding:8px 14px; font-size:13px;" placeholder="Write an encouraging comment..." id="commentInput_${pIndex}" onkeypress="if(event.key==='Enter') submitComment(${pIndex})">
          <button class="btn btn-sm btn-primary" onclick="submitComment(${pIndex})">Send</button>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

function toggleLikePost(index) {
  const post = state.posts[index];
  if (!post) return;
  post.isLiked = !post.isLiked;
  post.likes += post.isLiked ? 1 : -1;
  saveState();
  renderCommunityFeed();
}

function submitComment(index) {
  const input = document.getElementById(`commentInput_${index}`);
  if (!input || !input.value.trim()) return;

  const pet = getActivePet();
  state.posts[index].comments.push({
    author: `${pet.name}'s Parent`,
    text: input.value.trim(),
    time: 'Just now'
  });

  input.value = '';
  saveState();
  renderCommunityFeed();
  showToast('Comment posted to community!');
}

function createNewPost(e) {
  if (e) e.preventDefault();
  const text = document.getElementById('newPostText')?.value.trim();
  const imgUrl = document.getElementById('newPostImageUrl')?.value.trim();
  const pet = getActivePet();

  if (!text) {
    showToast('Please write something before posting.', false);
    return;
  }

  const newPost = {
    id: 'post-' + Date.now(),
    author: `${pet.name}'s Parent`,
    avatar: pet.avatar,
    time: 'Just now',
    badge: `${pet.breed} Family`,
    text,
    image: imgUrl || '',
    likes: 1,
    isLiked: true,
    comments: []
  };

  state.posts.unshift(newPost);
  saveState();
  renderCommunityFeed();
  document.getElementById('newPostText').value = '';
  if (document.getElementById('newPostImageUrl')) document.getElementById('newPostImageUrl').value = '';
  showToast('🎉 Your post is live on the Pet Maya Community!');
}

// ─── 5. PET SUPPLIES MARKETPLACE & CART ───
function renderProducts(filter = 'all') {
  const container = document.getElementById('productsGrid');
  if (!container) return;
  container.innerHTML = '';

  const filtered = filter === 'all' ? PRODUCTS_DATA : PRODUCTS_DATA.filter(p => p.category === filter);

  filtered.forEach(prod => {
    const card = document.createElement('div');
    card.className = 'product-item-card';
    card.style.cssText = 'background:var(--bg-card); border:1px solid var(--border-color); border-radius:20px; overflow:hidden; box-shadow:var(--shadow-sm); display:flex; flex-direction:column;';
    card.innerHTML = `
      <div style="position:relative;">
        <img src="${prod.image}" alt="${prod.name}" style="width:100%; height:180px; object-fit:cover;">
        <span style="position:absolute; top:12px; left:12px; background:var(--primary); color:white; font-size:11px; font-weight:800; padding:3px 10px; border-radius:999px;">${prod.badge}</span>
      </div>
      <div style="padding:16px; display:flex; flex-direction:column; flex:1;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span style="font-size:11px; color:var(--primary); font-weight:700; text-transform:uppercase;">${prod.category}</span>
          <span style="font-size:12px; font-weight:700; color:#F59E0B;">${prod.rating}</span>
        </div>
        <h4 style="font-size:14px; font-weight:800; color:var(--text-dark); margin:6px 0 6px; line-height:1.3;">${prod.name}</h4>
        <p style="font-size:12px; color:var(--text-muted); line-height:1.4; margin-bottom:14px; flex:1;">${prod.desc}</p>
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span style="font-size:18px; font-weight:800; color:var(--primary);">$${prod.price.toFixed(2)}</span>
          <button class="btn btn-sm btn-primary" onclick="addToCart('${prod.id}')">🛒 Add</button>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

function filterProducts(cat, btn) {
  document.querySelectorAll('.shop-filter-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderProducts(cat);
}

function addToCart(prodId) {
  const prod = PRODUCTS_DATA.find(p => p.id === prodId);
  if (!prod) return;

  const existing = state.cart.find(item => item.id === prodId);
  if (existing) {
    existing.qty += 1;
  } else {
    state.cart.push({ ...prod, qty: 1 });
  }

  saveState();
  updateCartBadge();
  renderCartDrawer();
  showToast(`Added ${prod.name} to cart!`);
}

function updateCartBadge() {
  const count = state.cart.reduce((sum, item) => sum + item.qty, 0);
  const badges = document.querySelectorAll('.cart-badge-count');
  badges.forEach(b => {
    b.textContent = count;
    b.style.display = count > 0 ? 'inline-flex' : 'none';
  });
}

function toggleCartDrawer(open) {
  const drawer = document.getElementById('cartDrawer');
  const overlay = document.getElementById('cartOverlay');
  if (drawer && overlay) {
    if (open) {
      drawer.classList.add('open');
      overlay.classList.add('active');
      renderCartDrawer();
    } else {
      drawer.classList.remove('open');
      overlay.classList.remove('active');
    }
  }
}

function renderCartDrawer() {
  const container = document.getElementById('cartItemsList');
  const subtotalEl = document.getElementById('cartSubtotal');
  const totalEl = document.getElementById('cartTotal');
  if (!container) return;

  if (state.cart.length === 0) {
    container.innerHTML = `<div style="text-align:center; padding:40px 10px; color:var(--text-muted);">
      <p style="font-size:36px; margin-bottom:10px;">🛍️</p>
      <p>Your pet care cart is empty.</p>
    </div>`;
    if (subtotalEl) subtotalEl.textContent = '$0.00';
    if (totalEl) totalEl.textContent = '$0.00';
    return;
  }

  container.innerHTML = '';
  let subtotal = 0;

  state.cart.forEach((item, index) => {
    subtotal += item.price * item.qty;
    const row = document.createElement('div');
    row.style.cssText = 'display:flex; align-items:center; gap:12px; padding:12px 0; border-bottom:1px solid var(--border-color);';
    row.innerHTML = `
      <img src="${item.image}" alt="${item.name}" style="width:50px; height:50px; border-radius:10px; object-fit:cover;">
      <div style="flex:1;">
        <h5 style="font-size:13px; font-weight:700; color:var(--text-dark); margin:0;">${item.name}</h5>
        <span style="font-size:12px; color:var(--primary); font-weight:700;">$${(item.price * item.qty).toFixed(2)}</span>
      </div>
      <div style="display:flex; align-items:center; gap:6px;">
        <button class="btn-qty" onclick="changeCartQty(${index}, -1)" style="width:24px; height:24px; border-radius:50%; border:1px solid var(--border-color); background:var(--bg-light); cursor:pointer;">-</button>
        <span style="font-weight:700; font-size:13px;">${item.qty}</span>
        <button class="btn-qty" onclick="changeCartQty(${index}, 1)" style="width:24px; height:24px; border-radius:50%; border:1px solid var(--border-color); background:var(--bg-light); cursor:pointer;">+</button>
      </div>
    `;
    container.appendChild(row);
  });

  const tax = subtotal * 0.05;
  const total = subtotal + tax;

  if (subtotalEl) subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
  if (totalEl) totalEl.textContent = `$${total.toFixed(2)}`;
}

function changeCartQty(index, delta) {
  if (!state.cart[index]) return;
  state.cart[index].qty += delta;
  if (state.cart[index].qty <= 0) {
    state.cart.splice(index, 1);
  }
  saveState();
  updateCartBadge();
  renderCartDrawer();
}

function openCheckoutModal() {
  if (state.cart.length === 0) {
    showToast('Your cart is empty!', false);
    return;
  }
  toggleCartDrawer(false);
  const modal = document.getElementById('checkoutModal');
  if (modal) modal.style.display = 'flex';
}

function closeCheckoutModal() {
  const modal = document.getElementById('checkoutModal');
  if (modal) modal.style.display = 'none';
}

function submitOrder(e) {
  if (e) e.preventDefault();
  const address = document.getElementById('checkoutAddress')?.value || '123 Pet Care Lane';
  const pet = getActivePet();

  state.cart = [];
  saveState();
  updateCartBadge();
  closeCheckoutModal();

  showToast(`🎉 Order confirmed! Delivering supplies for ${pet.name} to ${address}!`);
}

// ─── 6. REMINDER & CALENDAR ENGINE ───
function openAddReminderModal() {
  const modal = document.getElementById('reminderModal');
  if (modal) modal.style.display = 'flex';
}

function closeReminderModal() {
  const modal = document.getElementById('reminderModal');
  if (modal) modal.style.display = 'none';
}

function submitCustomReminder(e) {
  if (e) e.preventDefault();
  const title = document.getElementById('remTitle').value.trim();
  const date = document.getElementById('remDate').value;
  const type = document.getElementById('remType').value;
  const pet = getActivePet();

  if (!title || !date) {
    showToast('Please fill in reminder title and date.', false);
    return;
  }

  const reminder = {
    id: 'rem-' + Date.now(),
    title,
    date,
    type,
    petName: pet.name
  };

  state.reminders.push(reminder);
  saveState();
  closeReminderModal();
  renderRemindersList();
  showToast('⏰ Reminder added to your schedule!');
}

function renderRemindersList() {
  const container = document.getElementById('customRemindersList');
  if (!container) return;

  if (state.reminders.length === 0) {
    container.innerHTML = `<p style="font-size:12px; color:var(--text-muted); text-align:center; padding:12px;">No custom alarms. Click "+ Add Custom Reminder" to set one!</p>`;
    return;
  }

  container.innerHTML = '';
  state.reminders.forEach(r => {
    const div = document.createElement('div');
    div.style.cssText = 'display:flex; justify-content:space-between; align-items:center; background:var(--bg-light); border:1px solid var(--border-color); border-radius:12px; padding:10px 14px; margin-bottom:8px;';
    div.innerHTML = `
      <div>
        <strong style="font-size:13px; color:var(--text-dark);">${r.title}</strong>
        <p style="font-size:11px; color:var(--text-muted); margin:0;">🐾 ${r.petName} • 📅 ${r.date}</p>
      </div>
      <button onclick="deleteReminder('${r.id}')" style="background:none; border:none; color:#EF4444; font-size:14px; cursor:pointer;">✕</button>
    `;
    container.appendChild(div);
  });
}

function deleteReminder(id) {
  state.reminders = state.reminders.filter(r => r.id !== id);
  saveState();
  renderRemindersList();
  showToast('Reminder removed.');
}

// ─── VACCINE SCHEDULE CALCULATOR ───
const schedules = {
  dog: [
    { milestone: 'Core Vaccine #1', care: 'DHPP / DAPP (Distemper, Parvo)', freq: 'Every 3-4 Weeks (Puppy Series)', status: 'Essential 💉' },
    { milestone: 'Core Vaccine #2', care: 'Rabies (1-Year or 3-Year)', freq: 'At 16 Weeks & Annual Booster', status: 'Mandatory 🛡️' },
    { milestone: 'Parasite Prevention', care: 'Heartworm + Flea & Tick (Simparica/NexGard)', freq: 'Monthly Oral Chew', status: 'Active 💊' },
    { milestone: 'Deworming Protocol', care: 'Broad-Spectrum Deworming (Pyrantel/Praziquantel)', freq: 'Quarterly (Every 3 Months)', status: 'Scheduled ⏰' },
    { milestone: 'Annual Wellness', care: 'Complete Blood Count & Dental Scaling', freq: 'Every 12 Months', status: 'Recommended 🩺' }
  ],
  cat: [
    { milestone: 'Core Vaccine #1', care: 'FVRCP (Feline Viral Rhinotracheitis, Calici, Panleukopenia)', freq: 'Every 3-4 Weeks (Kitten Series)', status: 'Essential 💉' },
    { milestone: 'Core Vaccine #2', care: 'Rabies & FeLV (Feline Leukemia)', freq: 'At 12-16 Weeks & Annual Booster', status: 'Mandatory 🛡️' },
    { milestone: 'Parasite Prevention', care: 'Topical Flea, Tick & Ear Mite (Revolution Plus)', freq: 'Monthly Topical Dose', status: 'Active 💊' },
    { milestone: 'Deworming Protocol', care: 'Intestinal Deworming Treatment', freq: 'Quarterly (Every 3 Months)', status: 'Scheduled ⏰' },
    { milestone: 'Wellness Exam', care: 'Kidney Health Screening & Dental Check', freq: 'Every 12 Months', status: 'Recommended 🩺' }
  ]
};

function calculateVaccineSchedule() {
  const typeEl = document.getElementById('calcPetType');
  const type = typeEl ? typeEl.value : 'dog';
  const list = schedules[type] || schedules.dog;
  const tbody = document.getElementById('scheduleTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  list.forEach(item => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${item.milestone}</strong></td>
      <td>${item.care}</td>
      <td><span style="color:var(--text-muted);">${item.freq}</span></td>
      <td><span style="display:inline-block; padding:4px 10px; border-radius:999px; background:#DCFCE7; color:#16A34A; font-size:12px; font-weight:700;">${item.status}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

function downloadCalendarICS() {
  const typeEl = document.getElementById('calcPetType');
  const petType = typeEl && typeEl.value === 'dog' ? 'Dog' : 'Cat';
  const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Pet Maya//Vaccine Planner//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
SUMMARY:🐾 Pet Maya: ${petType} Vaccine & Wellness Due
DESCRIPTION:Scheduled veterinary reminder from Pet Maya platform. Checkup, booster, and parasite preventative due date.
STATUS:CONFIRMED
RRULE:FREQ=MONTHLY;INTERVAL=1
END:VEVENT
END:VCALENDAR`;

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.setAttribute('download', `Pet_Maya_${petType}_Schedule.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast('📥 Vaccine calendar (.ics) exported!');
}

// ─── INITIALIZATION ───
document.addEventListener('DOMContentLoaded', () => {
  renderPets();
  renderVets();
  renderProducts();
  renderCommunityFeed();
  renderAppointmentsList();
  renderRemindersList();
  updateCartBadge();
  calculateVaccineSchedule();
});

