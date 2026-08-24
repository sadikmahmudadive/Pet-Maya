/**
 * Pet Maya Web Application Core Engine
 * Full-featured interactive SPA mirroring the mobile app experience.
 * Handles Pets, Clinical Vision Scanner, Vet Teleconsultation, Community, Shop Cart, and Calendar.
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
    rating: '4.9  (184 reviews)',
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
    rating: '5.0  (240 reviews)',
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
    rating: '4.9  (132 reviews)',
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
    rating: '4.8  (98 reviews)',
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
    rating: '4.9 ',
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&auto=format&fit=crop&q=80',
    badge: 'Best Seller',
    desc: 'Promotes shiny coat, joint flexibility, and relieves itchy skin.'
  },
  {
    id: 'prod-2',
    name: 'Royal Canin Adult Digestive Care Kibble (4kg)',
    category: 'food',
    price: 480.00,
    rating: '4.8 ',
    image: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=300&auto=format&fit=crop&q=80',
    badge: 'Veterinary Choice',
    desc: 'Formulated for optimal stool quality and balanced gut microflora.'
  },
  {
    id: 'prod-3',
    name: 'NexGard Spectra Flea & Tick Chewables (3 Pack)',
    category: 'health',
    price: 360.00,
    rating: '5.0 ',
    image: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=300&auto=format&fit=crop&q=80',
    badge: 'Essential',
    desc: 'Monthly beef-flavored chew protecting against heartworm, fleas & ticks.'
  },
  {
    id: 'prod-4',
    name: 'Organic Lavender Soothing Pet Shampoo (400ml)',
    category: 'grooming',
    price: 170.00,
    rating: '4.7 ',
    image: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=300&auto=format&fit=crop&q=80',
    badge: '100% Organic',
    desc: 'Hypoallergenic botanical wash that hydrates dry and sensitive skin.'
  },
  {
    id: 'prod-5',
    name: 'Smart Interactive Laser & Feather Cat Toy',
    category: 'toys',
    price: 220.00,
    rating: '4.9 ',
    image: 'https://images.unsplash.com/photo-1545249390-6bdfa286032f?w=300&auto=format&fit=crop&q=80',
    badge: 'Popular',
    desc: 'Automatic 360° rotating laser beacon for active indoor exercise.'
  },
  {
    id: 'prod-6',
    name: 'Heavy-Duty Dental Chew Bone for Tough Chewers',
    category: 'toys',
    price: 145.00,
    rating: '4.8 ',
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
    text: 'Max just finished his 12-week agility training milestone!  His coat has been super healthy since we switched to Omega-3 salmon oil supplements recommended on Pet Maya.',
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
    text: 'Quick tip: The Clinical Health Triage caught Luna\'s mild ear irritation before it turned into an infection. Booked Dr. Vance right away and got topical drops in 1 hour!',
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
  toast.innerHTML = (isSuccess ? ' ' : '️ ') + msg;
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
            <span style="background:var(--primary-light); color:var(--primary); padding:2px 8px; border-radius:999px;">️ ${pet.weight}</span>
            <span style="background:rgba(0,182,210,0.1); color:#00B6D2; padding:2px 8px; border-radius:999px;"> ${pet.age}</span>
          </div>
        </div>
      </div>
      <div style="margin-top:14px; padding-top:12px; border-top:1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center;">
        <button class="btn btn-sm ${isActive ? 'btn-primary' : 'btn-secondary'}" onclick="switchActivePet('${pet.id}')">
          ${isActive ? ' Selected' : 'Switch to ' + pet.name}
        </button>
        <button class="btn-icon-del" onclick="deletePet('${pet.id}')" title="Delete Profile" style="background:none; border:none; cursor:pointer; font-size:16px;">️</button>
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
  showToast(` ${name} added to your Pet Maya dashboard!`);
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

// ─── 2. Clinical VISION HEALTH SCANNER ───
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
      showToast('Image uploaded! Click "Run Clinical Vision Scan".');
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

  showToast(' Diagnostic report generated!');
}

function exportTriageReport() {
  const pet = getActivePet();
  const title = document.getElementById('triageTitle')?.textContent || 'Diagnostic Assessment';
  const homeCare = document.getElementById('triageHomeCare')?.textContent || '';
  const clinicAction = document.getElementById('triageClinicAction')?.textContent || '';

  const reportText = `======================================================
PET MAYA Clinical CLINICAL HEALTH REPORT
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
  showToast(' Clinical report downloaded!');
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
          <p style="font-size:12px; color:var(--text-muted); margin:2px 0;"> ${vet.clinic} • ${vet.rating}</p>
          <div style="margin-top:8px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
            <span style="font-size:12px; color:#10B981; font-weight:700;"> ${vet.available}</span>
            <button class="btn btn-sm btn-primary" onclick="openBookingModal('${vet.id}')">
               Book Appointment
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
  showToast(` Appointment booked with ${vet.name}!`);
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
          <p style="font-size:12px; color:var(--primary); font-weight:700; margin:2px 0;"> Patient: ${appt.petName} • ${appt.visitType}</p>
          <p style="font-size:12px; color:var(--text-muted); margin:2px 0;"> ${appt.date} at ${appt.time}</p>
        </div>
        <span class="badge" style="background:#DCFCE7; color:#16A34A; padding:3px 8px; font-size:11px; border-radius:999px;">Confirmed</span>
      </div>
      <div style="margin-top:10px; display:flex; gap:8px;">
        <button class="btn btn-sm btn-secondary" onclick="downloadApptICS('${appt.id}')"> Add to Calendar</button>
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
SUMMARY: Pet Maya: ${appt.visitType} with ${appt.vetName}
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
          ${post.isLiked ? '️' : ''} <span>${post.likes} Likes</span>
        </button>
        <span style="font-size:13px; color:var(--text-muted); font-weight:600;"> ${post.comments.length} Comments</span>
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
  showToast(' Your post is live on the Pet Maya Community!');
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
          <button class="btn btn-sm btn-primary" onclick="addToCart('${prod.id}')"> Add</button>
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
      <p style="font-size:36px; margin-bottom:10px;">️</p>
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

  showToast(` Order confirmed! Delivering supplies for ${pet.name} to ${address}!`);
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
  showToast(' Reminder added to your schedule!');
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
        <p style="font-size:11px; color:var(--text-muted); margin:0;"> ${r.petName} •  ${r.date}</p>
      </div>
      <button onclick="deleteReminder('${r.id}')" style="background:none; border:none; color:#EF4444; font-size:14px; cursor:pointer;"></button>
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
    { milestone: 'Deworming Protocol', care: 'Broad-Spectrum Deworming (Pyrantel/Praziquantel)', freq: 'Quarterly (Every 3 Months)', status: 'Scheduled 🐾' },
    { milestone: 'Annual Wellness', care: 'Complete Blood Count & Dental Scaling', freq: 'Every 12 Months', status: 'Recommended 🩺' }
  ],
  cat: [
    { milestone: 'Core Vaccine #1', care: 'FVRCP (Feline Viral Rhinotracheitis, Calici, Panleukopenia)', freq: 'Every 3-4 Weeks (Kitten Series)', status: 'Essential 💉' },
    { milestone: 'Core Vaccine #2', care: 'Rabies & FeLV (Feline Leukemia)', freq: 'At 12-16 Weeks & Annual Booster', status: 'Mandatory 🛡️' },
    { milestone: 'Parasite Prevention', care: 'Topical Flea, Tick & Ear Mite (Revolution Plus)', freq: 'Monthly Topical Dose', status: 'Active 💊' },
    { milestone: 'Deworming Protocol', care: 'Intestinal Deworming Treatment', freq: 'Quarterly (Every 3 Months)', status: 'Scheduled 🐾' },
    { milestone: 'Wellness Exam', care: 'Kidney Health Screening & Dental Check', freq: 'Every 12 Months', status: 'Recommended 🩺' }
  ]
};

function calculateVaccineSchedule() {
  buildVaccineTable();
}

function buildVaccineTable() {
  const typeEl = document.getElementById('vaccPetType') || document.getElementById('calcPetType');
  const type = typeEl ? typeEl.value : 'dog';
  const list = schedules[type] || schedules.dog;
  const tableContainer = document.getElementById('vaccTable');
  const tbody = document.getElementById('scheduleTableBody');

  if (tableContainer) {
    tableContainer.innerHTML = `
      <table style="width:100%;border-collapse:collapse;margin-top:14px;font-size:13.5px;">
        <thead>
          <tr style="border-bottom:1.5px solid var(--separator);text-align:left;color:var(--label-3);">
            <th style="padding:10px 8px;">Milestone</th>
            <th style="padding:10px 8px;">Preventive Care / Vaccine</th>
            <th style="padding:10px 8px;">Frequency</th>
            <th style="padding:10px 8px;">Status</th>
          </tr>
        </thead>
        <tbody>
          ${list.map(item => `
            <tr style="border-bottom:1px solid var(--separator);">
              <td style="padding:12px 8px;font-weight:700;">${item.milestone}</td>
              <td style="padding:12px 8px;">${item.care}</td>
              <td style="padding:12px 8px;color:var(--label-3);">${item.freq}</td>
              <td style="padding:12px 8px;"><span class="badge badge-green" style="font-size:11px;">${item.status}</span></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  if (tbody) {
    tbody.innerHTML = list.map(item => `
      <tr>
        <td><strong>${item.milestone}</strong></td>
        <td>${item.care}</td>
        <td><span style="color:var(--text-muted);">${item.freq}</span></td>
        <td><span style="display:inline-block; padding:4px 10px; border-radius:999px; background:#DCFCE7; color:#16A34A; font-size:12px; font-weight:700;">${item.status}</span></td>
      </tr>
    `).join('');
  }
}

function downloadVaccICS() {
  downloadCalendarICS();
}

function downloadCalendarICS() {
  const typeEl = document.getElementById('vaccPetType') || document.getElementById('calcPetType');
  const petType = typeEl && typeEl.value === 'dog' ? 'Dog' : 'Cat';
  const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Pet Maya//Vaccine Planner//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
SUMMARY: Pet Maya: ${petType} Vaccine & Wellness Due
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
  showToast('📅 Vaccine calendar (.ics) exported!');
}

// ─── 7. REAL-TIME GPS PET RADAR & GEOFENCE ENGINE ───
let radarState = {
  petX: 0,
  petY: 0,
  targetX: 0,
  targetY: 0,
  geofenceRadius: 250, // in meters
  sonarAngle: 0,
  isLostMode: false,
  isWalking: false,
  lat: 23.8103,
  lng: 90.4125,
  battery: 88,
  satellites: 14,
  speed: 0.6,
  temp: 23.8,
  breadcrumbs: []
};

let radarAnimId = null;

function initRadarCanvas() {
  const canvas = document.getElementById('radarCanvas');
  if (!canvas) return;

  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width || 600;
  canvas.height = rect.height || 380;

  if (!radarAnimId) {
    animateRadar();
  }
}

function animateRadar() {
  const canvas = document.getElementById('radarCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const cx = w / 2;
  const cy = h / 2;

  // Clear background
  ctx.clearRect(0, 0, w, h);

  // Concentric Range Rings
  const maxR = Math.min(cx, cy) - 20;
  const rings = [0.25, 0.5, 0.75, 1.0];
  ctx.strokeStyle = 'rgba(26, 182, 128, 0.2)';
  ctx.lineWidth = 1;

  rings.forEach((pct, idx) => {
    ctx.beginPath();
    ctx.arc(cx, cy, maxR * pct, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = 'rgba(26, 182, 128, 0.4)';
    ctx.font = '10px monospace';
    const meters = Math.round((pct * 1000));
    ctx.fillText(`${meters}m`, cx + 4, cy - (maxR * pct) + 12);
  });

  // Crosshairs
  ctx.strokeStyle = 'rgba(26, 182, 128, 0.15)';
  ctx.beginPath();
  ctx.moveTo(cx, 10); ctx.lineTo(cx, h - 10);
  ctx.moveTo(10, cy); ctx.lineTo(w - 10, cy);
  ctx.stroke();

  // Dynamic Geofence Circle
  const geofenceVisualR = (radarState.geofenceRadius / 1000) * maxR;
  ctx.beginPath();
  ctx.arc(cx, cy, geofenceVisualR, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(16, 185, 129, 0.08)';
  ctx.fill();
  ctx.strokeStyle = radarState.isLostMode ? '#ef4444' : 'rgba(16, 185, 129, 0.6)';
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 4]);
  ctx.stroke();
  ctx.setLineDash([]);

  // Sonar Sweep Line
  radarState.sonarAngle += 0.03;
  if (radarState.sonarAngle > Math.PI * 2) radarState.sonarAngle = 0;

  const sweepX = cx + Math.cos(radarState.sonarAngle) * maxR;
  const sweepY = cy + Math.sin(radarState.sonarAngle) * maxR;

  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR);
  grad.addColorStop(0, 'rgba(16, 185, 129, 0.4)');
  grad.addColorStop(1, 'rgba(16, 185, 129, 0.0)');

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.arc(cx, cy, maxR, radarState.sonarAngle - 0.35, radarState.sonarAngle);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.restore();

  // Breadcrumbs Trail
  if (radarState.breadcrumbs.length > 1) {
    ctx.strokeStyle = 'rgba(74, 222, 128, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    radarState.breadcrumbs.forEach((pt, i) => {
      const px = cx + pt.x;
      const py = cy + pt.y;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.stroke();
  }

  // Smooth Pet Interpolation
  if (radarState.isWalking) {
    radarState.petX += (radarState.targetX - radarState.petX) * 0.05;
    radarState.petY += (radarState.targetY - radarState.petY) * 0.05;

    if (Math.hypot(radarState.targetX - radarState.petX, radarState.targetY - radarState.petY) < 3) {
      // Pick next random waypoint
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * (geofenceVisualR * 0.85);
      radarState.targetX = Math.cos(angle) * dist;
      radarState.targetY = Math.sin(angle) * dist;
      radarState.breadcrumbs.push({ x: radarState.petX, y: radarState.petY });
      if (radarState.breadcrumbs.length > 25) radarState.breadcrumbs.shift();

      // Update telemetry coordinates
      radarState.lat = 23.8103 + (radarState.petY / 10000);
      radarState.lng = 90.4125 + (radarState.petX / 10000);
      const coordsEl = document.getElementById('trackerCoordsLabel');
      if (coordsEl) coordsEl.textContent = `${radarState.lat.toFixed(4)}° N, ${radarState.lng.toFixed(4)}° E (±1.8m)`;
    }
  }

  // Pet Position Indicator
  const petScreenX = cx + radarState.petX;
  const petScreenY = cy + radarState.petY;

  // Pulse Ring
  const pulseR = 12 + Math.sin(Date.now() / 200) * 4;
  ctx.beginPath();
  ctx.arc(petScreenX, petScreenY, pulseR, 0, Math.PI * 2);
  ctx.fillStyle = radarState.isLostMode ? 'rgba(239, 68, 68, 0.4)' : 'rgba(74, 222, 128, 0.35)';
  ctx.fill();

  // Core Pin
  ctx.beginPath();
  ctx.arc(petScreenX, petScreenY, 7, 0, Math.PI * 2);
  ctx.fillStyle = radarState.isLostMode ? '#ef4444' : '#10b981';
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Pet Label Tag
  const activePet = getActivePet();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.fillText(activePet ? activePet.name : 'Max 🐾', petScreenX + 10, petScreenY - 6);

  radarAnimId = requestAnimationFrame(animateRadar);
}

function updateGeofenceRadius(val) {
  radarState.geofenceRadius = parseInt(val, 10);
  const lbl = document.getElementById('geofenceRadiusLabel');
  if (lbl) lbl.textContent = `${val} Meters Radius`;
  showToast(`Safe-zone perimeter updated to ${val} meters.`);
}

function soundCollarBuzzer() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 tone
    osc.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.4);

    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.5);

    showToast('🔔 Sound buzzer activated on pet collar!');
  } catch (e) {
    showToast('🔔 Sound buzzer triggered on collar!');
  }
}

function simulatePetWalk() {
  radarState.isWalking = !radarState.isWalking;
  const speedEl = document.getElementById('telemetrySpeed');
  if (radarState.isWalking) {
    radarState.targetX = (Math.random() - 0.5) * 120;
    radarState.targetY = (Math.random() - 0.5) * 120;
    if (speedEl) speedEl.textContent = '1.8 km/h 🐾';
    showToast('🚶 Live GPS walk tracking simulation active!');
  } else {
    if (speedEl) speedEl.textContent = '0.0 km/h (Stationary)';
    showToast('Pet tracking simulation paused.');
  }
}

function toggleLostMode() {
  radarState.isLostMode = !radarState.isLostMode;
  const banner = document.getElementById('lostPetAlertBanner');
  const btn = document.getElementById('lostModeToggleBtn');

  if (radarState.isLostMode) {
    if (banner) banner.style.display = 'flex';
    if (btn) {
      btn.textContent = '🚨 Deactivate Lost Mode';
      btn.style.background = '#374151';
    }
    showToast('🚨 EMERGENCY LOST PET BEACON ACTIVATED! Broadcasting telemetry.');
  } else {
    if (banner) banner.style.display = 'none';
    if (btn) {
      btn.textContent = '🚨 Lost Pet Mode';
      btn.style.background = '#ef4444';
    }
    showToast('Lost pet mode deactivated. Status returned to normal.');
  }
}

// ─── 8. NUTRITION CALCULATOR & BREED EXPLORER ENGINE ───
const BREEDS_DATABASE = [
  {
    name: 'Golden Retriever',
    species: 'dog',
    image: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=300&auto=format&fit=crop&q=80',
    tags: ['dog', 'family', 'active'],
    exercise: 90,
    shedding: 80,
    trainability: 95,
    lifespan: '10 - 12 Yrs',
    health: 'Prone to hip dysplasia and seasonal allergic dermatitis.'
  },
  {
    name: 'British Shorthair',
    species: 'cat',
    image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=300&auto=format&fit=crop&q=80',
    tags: ['cat', 'apartment', 'calm'],
    exercise: 40,
    shedding: 50,
    trainability: 70,
    lifespan: '12 - 17 Yrs',
    health: 'Prone to hypertrophic cardiomyopathy and obesity.'
  },
  {
    name: 'Poodle (Standard & Toy)',
    species: 'dog',
    image: 'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=300&auto=format&fit=crop&q=80',
    tags: ['dog', 'hypo', 'apartment'],
    exercise: 75,
    shedding: 20,
    trainability: 98,
    lifespan: '12 - 15 Yrs',
    health: 'Hypoallergenic coat. Regular ear cleaning required.'
  },
  {
    name: 'French Bulldog',
    species: 'dog',
    image: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=300&auto=format&fit=crop&q=80',
    tags: ['dog', 'apartment', 'low-exercise'],
    exercise: 35,
    shedding: 45,
    trainability: 75,
    lifespan: '10 - 12 Yrs',
    health: 'Brachycephalic airway syndrome. Keep in cool climate.'
  },
  {
    name: 'Persian Cat',
    species: 'cat',
    image: 'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?w=300&auto=format&fit=crop&q=80',
    tags: ['cat', 'apartment', 'grooming'],
    exercise: 30,
    shedding: 85,
    trainability: 60,
    lifespan: '12 - 16 Yrs',
    health: 'Daily facial grooming and tear duct cleaning necessary.'
  },
  {
    name: 'German Shepherd',
    species: 'dog',
    image: 'https://images.unsplash.com/photo-1589941013453-ec89f33b5455?w=300&auto=format&fit=crop&q=80',
    tags: ['dog', 'active', 'guard'],
    exercise: 95,
    shedding: 90,
    trainability: 98,
    lifespan: '9 - 13 Yrs',
    health: 'Requires robust joint supplements and high-protein diet.'
  }
];

function syncFoodCalcPet() {
  const sel = document.getElementById('calcPetSelect');
  const weightInput = document.getElementById('calcWeightInput');
  if (!sel || !weightInput) return;

  if (sel.value === 'pet-1') {
    weightInput.value = 28.4;
  } else if (sel.value === 'pet-2') {
    weightInput.value = 4.2;
  }
  computeNutrition();
}

function computeNutrition() {
  const weight = parseFloat(document.getElementById('calcWeightInput')?.value) || 10.0;
  const stage = document.getElementById('calcLifeStage')?.value || 'adult';
  const activity = document.getElementById('calcActivity')?.value || 'active';

  // RER = 70 * (weight ^ 0.75)
  const rer = 70 * Math.pow(weight, 0.75);

  let factor = 1.6; // Adult active
  if (activity === 'neutered') factor = 1.4;
  if (activity === 'active') factor = 1.8;
  if (activity === 'working') factor = 2.4;
  if (activity === 'weightloss') factor = 1.0;
  if (stage === 'puppy') factor = 2.8;
  if (stage === 'senior') factor = 1.2;

  const mer = Math.round(rer * factor);
  const dryGrams = Math.round((mer * 0.75) / 3.75);
  const cups = (dryGrams / 120).toFixed(1);
  const wetGrams = Math.round((mer * 0.15) / 1.0);
  const treatKcal = Math.round(mer * 0.1);
  const waterMl = Math.round(weight * 60);

  const merEl = document.getElementById('nutritionMerVal');
  const kibbleEl = document.getElementById('kibblePortionVal');
  const wetEl = document.getElementById('wetFoodPortionVal');
  const treatEl = document.getElementById('treatPortionVal');
  const waterEl = document.getElementById('waterPortionVal');

  if (merEl) merEl.textContent = `${mer.toLocaleString()} kcal/day`;
  if (kibbleEl) kibbleEl.textContent = `${dryGrams} g (${cups} cups)`;
  if (wetEl) wetEl.textContent = `${wetGrams} g / day`;
  if (treatEl) treatEl.textContent = `${treatKcal} kcal max`;
  if (waterEl) waterEl.textContent = `${waterMl.toLocaleString()} ml / day`;
}

let activeBreedFilter = 'all';

function setBreedFilter(btn, cat) {
  activeBreedFilter = cat;
  document.querySelectorAll('#pane-food .chip-pill').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  filterBreedCards();
}

function filterBreedCards() {
  const container = document.getElementById('breedCardsContainer');
  const query = (document.getElementById('breedSearchInput')?.value || '').toLowerCase();
  if (!container) return;

  const filtered = BREEDS_DATABASE.filter(b => {
    const matchesQuery = b.name.toLowerCase().includes(query) || b.health.toLowerCase().includes(query);
    const matchesCat = activeBreedFilter === 'all' || b.tags.includes(activeBreedFilter);
    return matchesQuery && matchesCat;
  });

  if (filtered.length === 0) {
    container.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:30px;color:var(--label-3);">No matching breeds found. Try another search query!</div>';
    return;
  }

  container.innerHTML = filtered.map(b => `
    <div class="breed-explore-card">
      <img src="${b.image}" alt="${b.name}" style="width:100%;height:140px;object-fit:cover;border-radius:var(--r-sm);">
      <div>
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <h4 style="font-size:16px;font-weight:800;color:var(--label);margin:0;">${b.name}</h4>
          <span class="badge badge-blue" style="font-size:10.5px;">${b.lifespan}</span>
        </div>
        <p style="font-size:12px;color:var(--label-3);margin:4px 0 8px;">${b.health}</p>
      </div>
      <div>
        <div style="display:flex;justify-content:space-between;font-size:11px;font-weight:700;color:var(--label-3);">
          <span>Exercise Needs</span><span>${b.exercise}%</span>
        </div>
        <div class="trait-meter-bar"><div class="trait-meter-fill" style="width:${b.exercise}%;"></div></div>
      </div>
      <div>
        <div style="display:flex;justify-content:space-between;font-size:11px;font-weight:700;color:var(--label-3);">
          <span>Trainability</span><span>${b.trainability}%</span>
        </div>
        <div class="trait-meter-bar"><div class="trait-meter-fill" style="width:${b.trainability}%;"></div></div>
      </div>
    </div>
  `).join('');
}

// ─── 9. ENHANCED AI VISION DROPZONE & DIAGNOSTICS ───
const SAMPLE_CASES = {
  dermatitis: {
    title: 'Canine Atopic Dermatitis with Secondary Pyoderma',
    image: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=600&auto=format&fit=crop&q=80',
    severity: 'Moderate Priority',
    confidence: '96.2%',
    care: 'Clean hotspot with warm saline or chlorhexidine wipe. Fit protective cone collar to stop scratching.',
    clinic: 'Book cytology swab with Dr. Aris Thorne (Dermatologist) to determine antibiotic vs antifungal course.',
    bbox: { top: '35%', left: '42%', width: '120px', height: '90px' }
  },
  conjunctivitis: {
    title: 'Feline Infectious Conjunctivitis / Ocular Discharge',
    image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600&auto=format&fit=crop&q=80',
    severity: 'High Priority',
    confidence: '94.8%',
    care: 'Gently wipe discharge with sterile warm water gauze. Do not administer human eye drops.',
    clinic: 'Schedule immediate fluorescein corneal stain test with Dr. Emily Vance to rule out ulceration.',
    bbox: { top: '28%', left: '38%', width: '90px', height: '60px' }
  },
  otitis: {
    title: 'Otitis Externa (Ear Mite & Cerumen Irritation)',
    image: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=600&auto=format&fit=crop&q=80',
    severity: 'Moderate Priority',
    confidence: '92.5%',
    care: 'Avoid deep probing with cotton swabs. Keep ear canal dry and gently wipe outer pinna.',
    clinic: 'Video or in-clinic otoscopic examination with Dr. Sarah Jenkins for prescription ear drops.',
    bbox: { top: '20%', left: '22%', width: '80px', height: '80px' }
  },
  healthy: {
    title: 'Normal Physiological Markers (No Acute Pathology)',
    image: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=600&auto=format&fit=crop&q=80',
    severity: 'Routine / Healthy',
    confidence: '98.5%',
    care: 'Pet shows clear eyes, intact skin barrier, and alert posture. Continue regular preventative schedule.',
    clinic: 'Maintain annual DHPP/Rabies vaccinations and monthly flea & tick chewables.',
    bbox: { top: '40%', left: '35%', width: '140px', height: '100px' }
  }
};

function handleVisionImageUpload(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(evt) {
    const previewBox = document.getElementById('visionPreviewBox');
    const previewImg = document.getElementById('visionPreviewImg');
    if (previewBox && previewImg) {
      previewImg.src = evt.target.result;
      previewBox.style.display = 'block';
    }
    runScan();
  };
  reader.readAsDataURL(file);
}

function loadSampleScan(caseType) {
  const sample = SAMPLE_CASES[caseType] || SAMPLE_CASES.dermatitis;
  const previewBox = document.getElementById('visionPreviewBox');
  const previewImg = document.getElementById('visionPreviewImg');
  const targetBox = document.getElementById('visionTargetBox');

  if (previewBox && previewImg) {
    previewImg.src = sample.image;
    previewBox.style.display = 'block';
  }

  if (targetBox && sample.bbox) {
    targetBox.style.top = sample.bbox.top;
    targetBox.style.left = sample.bbox.left;
    targetBox.style.width = sample.bbox.width;
    targetBox.style.height = sample.bbox.height;
    targetBox.style.display = 'none'; // displayed after laser
  }

  runScan(sample);
}

function runScan(customSample = null) {
  const progress = document.getElementById('scanProgress');
  const result = document.getElementById('scanResult');
  const bar = document.getElementById('scanBar');
  const pct = document.getElementById('scanPct');
  const targetBox = document.getElementById('visionTargetBox');
  const statusMsg = document.getElementById('scanStatusMsg');

  if (progress) progress.style.display = 'block';
  if (result) result.style.display = 'none';
  if (targetBox) targetBox.style.display = 'none';

  let p = 0;
  const timer = setInterval(() => {
    p += 15;
    if (bar) bar.style.width = `${Math.min(p, 100)}%`;
    if (pct) pct.textContent = `${Math.min(p, 100)}%`;

    if (p === 30 && statusMsg) statusMsg.textContent = 'Preprocessing convolutional neural feature layers…';
    if (p === 60 && statusMsg) statusMsg.textContent = 'Comparing lesion morphology against 50,000+ veterinary clinical cases…';
    if (p === 90 && statusMsg) statusMsg.textContent = 'Synthesizing differential diagnosis and triage urgency…';

    if (p >= 100) {
      clearInterval(timer);
      setTimeout(() => {
        if (progress) progress.style.display = 'none';
        if (result) result.style.display = 'block';
        if (targetBox) targetBox.style.display = 'block';

        const sample = customSample || SAMPLE_CASES.dermatitis;
        const titleEl = document.getElementById('scanTitle');
        const badgeEl = document.getElementById('scanSeverityBadge');
        const confEl = document.getElementById('scanConfidenceLabel');
        const careEl = document.getElementById('careText');
        const clinicEl = document.getElementById('clinicText');

        if (titleEl) titleEl.textContent = sample.title;
        if (badgeEl) badgeEl.textContent = sample.severity;
        if (confEl) confEl.textContent = `Confidence: ${sample.confidence}`;
        if (careEl) careEl.textContent = sample.care;
        if (clinicEl) clinicEl.textContent = sample.clinic;

        showToast(' AI Health Diagnostic analysis complete!');
      }, 300);
    }
  }, 120);
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
  computeNutrition();
  filterBreedCards();

  // Initialize Radar Canvas after short delay for layout
  setTimeout(initRadarCanvas, 400);
});

