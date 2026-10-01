// ──────────────────────────────────────────────────────────────
// Business promises and public claims, in one place.
// Only publish what Pet Maya can actually guarantee — edit freely.
// ──────────────────────────────────────────────────────────────

export const BRAND = {
  name: 'Pet Maya',
  tagline: 'Veterinary medicine',
  footerBlurb: 'Genuine pet medicine, vet-reviewed food and smart gear — with a vet, symptom checker and GPS tracking in the same app.',
  supportPhone: '',            // e.g. '+880 1XXX-XXXXXX' — shown on emergency CTAs when set
  supportEmail: 'support@petmaya.app',
  copyright: `© ${new Date().getFullYear()} Pet Maya`,
};

export const DELIVERY = {
  freeOver: 2500,              // free delivery threshold (BDT)
  standardFee: 60,
  coldExpressFee: 0,
  coldExpressLabel: 'Cold express (same day)',
  coldStandardLabel: 'Standard cold-chain (next day)',
  coldStandardFee: 150,
  coldRange: '2°C – 8°C',
  returnsDays: 7,
};

export const PROMOS = {
  firstOrderCode: 'PETMAYA10',
  firstOrderPct: 10,
  vetConsultFrom: 500,
};

export const ANNOUNCEMENTS = [
  `Code ${PROMOS.firstOrderCode} · ${PROMOS.firstOrderPct}% off your first order`,
  `Free delivery over ৳${DELIVERY.freeOver.toLocaleString('en-US')}`,
  `Vet on video · from ৳${PROMOS.vetConsultFrom}`,
];

export const TRUST = [
  { icon: 'cold', title: 'Cold-chain delivery', text: `Medicines kept at ${DELIVERY.coldRange}` },
  { icon: 'shield', title: 'Genuine stock', text: 'Traceable batches from authorised sources' },
  { icon: 'stethoscope', title: 'Vet-checked', text: 'Prescriptions reviewed by a licensed vet' },
  { icon: 'arrowRight', title: 'Easy returns', text: `Unopened items, ${DELIVERY.returnsDays} days` },
];

export const CATEGORIES = [
  { slug: 'dogs', label: 'Dogs', sub: 'Medicine, food, gear', icon: 'paw', tone: 'teal' },
  { slug: 'cats', label: 'Cats', sub: 'Care & nutrition', icon: 'paw', tone: '' },
  { slug: 'prescription', label: 'Prescription', sub: 'Vet-approved Rx', icon: 'flask', tone: 'yellow' },
  { slug: 'food', label: 'Food & diets', sub: 'Clinical & daily', icon: 'pulse', tone: '' },
  { slug: 'supplements', label: 'Supplements', sub: 'Joints, skin, calm', icon: 'heart', tone: 'teal' },
  { slug: 'grooming', label: 'Grooming & dental', sub: 'Coats, teeth, ears', icon: 'scissors', tone: '' },
  { slug: 'smart-gear', label: 'Smart gear', sub: 'GPS collars & more', icon: 'target', tone: '' },
  { slug: 'vet', label: 'Vet care', sub: 'Book in minutes', icon: 'stethoscope', tone: 'yellow', to: '/specialists' },
];

export const CONCERNS = [
  { label: 'Itchy skin & coat', icon: 'paw', cat: 'skin' },
  { label: 'Digestion', icon: 'pulse', cat: 'supplements' },
  { label: 'Joints & mobility', icon: 'bone', cat: 'joint' },
  { label: 'Fleas, ticks & worms', icon: 'shield', cat: 'antiparasitics' },
  { label: 'Dental', icon: 'smile', cat: 'grooming' },
  { label: 'Calm & anxiety', icon: 'heart', cat: 'calming' },
  { label: 'Senior care', icon: 'clock', cat: 'food' },
];

export const BRANDS = ['Boehringer Ingelheim', 'Zoetis', 'MSD Animal Health', 'Royal Canin', "Hill's Prescription", 'VetPlus'];
