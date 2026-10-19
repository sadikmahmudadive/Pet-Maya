// Sample data used ONLY when a Firestore collection is empty or unreachable,
// so every screen renders something sensible during setup. Live data always wins.

const today = new Date();
const at = (h, m, dayOffset = 0) => {
  const d = new Date(today);
  d.setDate(d.getDate() + dayOffset);
  d.setHours(h, m, 0, 0);
  return d.getTime();
};

export const SAMPLE_PRODUCTS = [
  { id: 'nexgard-spectra', name: 'NexGard Spectra Chews', brand: 'Boehringer Ingelheim', category: 'preventives', pet: 'dog', price: 1568, compareAt: 1800, rating: 4.9, ratingCount: 184, isRx: true, coldChain: false, badge: 'Best seller', sku: 'NX-4471', stockCount: 34, stockTarget: 100, reorderPoint: 60, variants: ['Small', 'Large', 'Giant'], subscribe: true,
    shortDescription: 'Monthly chewable against fleas, ticks, heartworm and intestinal worms.',
    description: 'Dual-action afoxolaner + milbemycin oxime chew. One chew a month protects against fleas, ticks, heartworm, lungworm and common intestinal worms. Dose by weight band.' },
  { id: 'nobivac-rabies', name: 'Nobivac Rabies', brand: 'MSD Animal Health', category: 'vaccines', pet: 'both', price: 850, rating: 4.9, ratingCount: 61, isRx: true, coldChain: true, badge: 'Cold-chain', sku: 'MS-2208', stockCount: 210, stockTarget: 300, reorderPoint: 80,
    shortDescription: 'Single-dose rabies vaccine. Kept at 2–8°C until it reaches you.',
    description: 'Inactivated rabies vaccine for dogs and cats. Must be administered by a veterinarian; shipped cold and handed over to your vet or at your door in an insulated pack.' },
  { id: 'apoquel-16', name: 'Apoquel 16mg Oclacitinib', brand: 'Zoetis', category: 'skin', pet: 'dog', price: 4200, rating: 4.8, ratingCount: 73, isRx: true, badge: 'Rx', sku: 'ZT-1190', stockCount: 18, stockTarget: 120, reorderPoint: 40, variants: ['20 tabs', '100 tabs'],
    shortDescription: 'Fast itch relief for allergic and atopic dermatitis.',
    description: 'Oclacitinib tablets for the control of itching associated with allergic dermatitis in dogs. Prescription required.' },
  { id: 'synoquin-efa', name: 'Synoquin EFA Joint Care', brand: 'VetPlus', category: 'joint', pet: 'dog', price: 2100, rating: 4.9, ratingCount: 67, badge: 'New', sku: 'VP-3301', stockCount: 156, stockTarget: 200, reorderPoint: 50, variants: ['30 tabs', '90 tabs'], subscribe: true,
    shortDescription: 'Glucosamine, chondroitin and omega oils for stiff joints.',
    description: 'A joint supplement combining glucosamine, chondroitin, omega-3 fatty acids and antioxidants to support mobility in ageing or active dogs.' },
  { id: 'rc-gastro-lowfat', name: 'Royal Canin Gastro Low Fat 4kg', brand: 'Royal Canin', category: 'food', pet: 'dog', price: 3450, rating: 4.8, ratingCount: 92, badge: 'Vet diet', sku: 'RC-7712', stockCount: 420, stockTarget: 500, reorderPoint: 100, variants: ['1.5 kg', '4 kg'],
    shortDescription: 'Low-fat veterinary diet for digestive upsets.',
    description: 'Veterinary dry diet for dogs with gastrointestinal disorders that need a low-fat food.' },
  { id: 'calming-probiotic', name: 'Maya GI Calming Probiotic', brand: 'Pet Maya', category: 'supplements', pet: 'both', price: 1150, rating: 4.8, ratingCount: 39, badge: 'New', sku: 'MY-1001', stockCount: 340, stockTarget: 400, reorderPoint: 80, subscribe: true,
    shortDescription: 'Daily probiotic chew for sensitive tummies.',
    description: 'A daily probiotic chew to support healthy digestion and calm behaviour during stressful periods.' },
  { id: 'deworm-dog', name: 'Deworming Tablets (dog)', brand: 'Pet Maya Rx', category: 'antiparasitics', pet: 'dog', price: 420, rating: 4.7, ratingCount: 42, sku: 'MY-1120', stockCount: 90, stockTarget: 200, reorderPoint: 40, variants: ['2 tabs', '6 tabs'],
    shortDescription: 'Broad-spectrum wormer for dogs.', description: 'Broad-spectrum tablet against roundworms, hookworms, whipworms and tapeworms.' },
  { id: 'flea-spot-on', name: 'Flea & Tick Spot-On', brand: 'Pet Maya Rx', category: 'antiparasitics', pet: 'dog', price: 890, rating: 4.8, ratingCount: 58, isRx: true, badge: 'Rx', sku: 'MY-1140', stockCount: 64, stockTarget: 150, reorderPoint: 40, variants: ['Small', 'Large'],
    shortDescription: 'Monthly spot-on for fleas and ticks.', description: 'Monthly topical treatment against fleas and ticks.' },
  { id: 'omega3-oil', name: 'Omega-3 Wild Anchovy Oil 237ml', brand: 'Nordic Naturals', category: 'supplements', pet: 'both', price: 2350, rating: 4.9, ratingCount: 81, sku: 'NN-0237', stockCount: 48, stockTarget: 80, reorderPoint: 20,
    shortDescription: 'Fish oil for skin, coat and joints.', description: 'Pure anchovy oil rich in EPA and DHA for skin, coat, joint and heart health.' },
  { id: 'ear-cleaner', name: 'Ear Cleaner & Drops', brand: 'Pet Maya Rx', category: 'skin', pet: 'both', price: 650, rating: 4.6, ratingCount: 27, isRx: true, badge: 'Rx', sku: 'MY-1180', stockCount: 72, stockTarget: 120, reorderPoint: 30,
    shortDescription: 'Gentle cleanser for itchy, waxy ears.', description: 'Ear cleanser and drops for routine hygiene and itchy ears.' },
  { id: 'feliway-optimum', name: 'Feliway Optimum Starter', brand: 'Ceva Santé', category: 'calming', pet: 'cat', price: 3100, rating: 4.7, ratingCount: 110, sku: 'CV-2001', stockCount: 26, stockTarget: 60, reorderPoint: 15,
    shortDescription: 'Plug-in diffuser that helps anxious cats settle.', description: 'Pheromone diffuser that helps cats feel calm at home.' },
  { id: 'maya-halo-v3', name: 'Maya Halo GPS Collar', brand: 'Pet Maya', category: 'smart-gear', pet: 'both', price: 12500, rating: 4.9, ratingCount: 203, badge: 'Smart gear', sku: 'MY-H3', stockCount: 41, stockTarget: 80, reorderPoint: 20, variants: ['26–50 cm', '40–70 cm'],
    shortDescription: 'Live GPS, safe zones and activity tracking.', description: 'GPS collar with live location in the Pet Maya app, safe-zone alerts and daily activity.' },
  { id: 'caninsulin-10', name: 'Insulin Caninsulin 10ml', brand: 'MSD Animal Health', category: 'medicine', pet: 'both', price: 2900, rating: 4.8, ratingCount: 19, isRx: true, coldChain: true, sku: 'MS-5521', stockCount: 22, stockTarget: 80, reorderPoint: 30, expiresInDays: 45,
    shortDescription: 'Insulin for diabetic dogs and cats.', description: 'Porcine insulin zinc suspension. Prescription and cold storage required.' },
  { id: 'hills-cd', name: "Hill's c/d Urinary 1.5kg", brand: "Hill's", category: 'food', pet: 'cat', price: 2450, rating: 4.7, ratingCount: 51, sku: 'HL-9034', stockCount: 0, stockTarget: 150, reorderPoint: 40,
    shortDescription: 'Urinary care veterinary diet.', description: 'Clinical nutrition to support urinary tract health.' },
  { id: 'rc-renal-2', name: 'Royal Canin Renal 2kg', brand: 'Royal Canin', category: 'food', pet: 'cat', price: 2950, rating: 4.8, ratingCount: 44, sku: 'RC-7810', stockCount: 88, stockTarget: 140, reorderPoint: 30,
    shortDescription: 'Kidney support diet.', description: 'Veterinary diet to support kidney function.' },
];

export const SAMPLE_VETS = [
  { id: 'v-sabrina', name: 'Dr. Sabrina Karim', specialty: 'Dermatology', tag: 'Veterinarian', price: 500, rating: 4.9, reviewsCount: 212, qualification: 'DVM', availability: 'Available today', focus: ['Allergy screening', 'Skin & ear infections', 'Itch management'], bio: 'Itchy skin, ear infections and allergies in dogs and cats.' },
  { id: 'v-tariq', name: 'Dr. Tariq Rahman', specialty: 'Internal medicine', tag: 'Veterinarian', price: 600, rating: 4.95, reviewsCount: 310, qualification: 'DVM, MS', availability: 'Next slot 4:30 PM', focus: ['Diabetes', 'Kidney disease', 'Digestive problems'], bio: 'Long-term conditions such as diabetes, kidney disease and chronic tummy trouble.' },
  { id: 'v-nadia', name: 'Dr. Nadia Vance', specialty: 'Emergency', tag: 'Veterinarian', price: 600, rating: 5.0, reviewsCount: 420, qualification: 'DVM', availability: 'On call now', emergency: true, focus: ['Poisoning', 'Breathing trouble', 'Trauma triage'], bio: 'Urgent problems: poisoning, collapse, injuries and breathing difficulty.' },
  { id: 'v-imran', name: 'Dr. Imran Ahmed', specialty: 'Behaviour', tag: 'Veterinarian', price: 450, rating: 4.9, reviewsCount: 156, qualification: 'DVM', availability: 'Available in 15 min', focus: ['Anxiety', 'Aggression', 'Toilet training'], bio: 'Anxiety, fear and behaviour changes — with a training plan you can follow at home.' },
  { id: 'v-nazmul', name: 'Dr. Nazmul Hoda', specialty: 'Orthopaedics', tag: 'Veterinarian', price: 500, rating: 4.99, reviewsCount: 612, qualification: 'DVM, MS', availability: 'Next slot tomorrow 10:00', focus: ['Limping', 'Ligament injuries', 'Post-surgery rehab'], bio: 'Limping, joint pain, fractures and recovery after orthopaedic surgery.' },
  { id: 'v-ananya', name: 'Dr. Ananya Roy', specialty: 'Feline medicine', tag: 'Veterinarian', price: 500, rating: 4.9, reviewsCount: 195, qualification: 'DVM', availability: 'Available today 18:00', focus: ['Senior cats', 'Kidney care', 'Weight & diet'], bio: 'Cats of every age — especially seniors, kidney care and weight management.' },
];

export const SAMPLE_PETS = [
  { id: 'p-milo', name: 'Milo', species: 'Dog', breed: 'Golden Retriever', age: '3 yrs', weight: '28.4 kg', gender: 'Male', neutered: true, microchip: '985-0012-TX', nextVaccine: '' },
  { id: 'p-cleo', name: 'Cleo', species: 'Cat', breed: 'Persian', age: '4 yrs', weight: '4.1 kg', gender: 'Female', neutered: true, microchip: '985-0044-CL', nextVaccine: '' },
];

// Prescription details attached to orders that are waiting for review.
export const SAMPLE_CUSTOMERS = [
  { id: 'u-nusrat', name: 'Nusrat Jahan', area: 'Gulshan', city: 'Dhaka', phone: '+880 1711-000214', email: 'nusrat@example.com', since: 'Mar 2025', pets: ['Milo · Labrador'], orders: 12, lifetime: 41200, subscription: { name: 'Synoquin EFA', every: 30, next: '12 Oct' } },
  { id: 'u-tanvir', name: 'Tanvir Hasan', area: 'Dhanmondi', city: 'Dhaka', phone: '+880 1712-000388', email: 'tanvir@example.com', since: 'Jan 2025', pets: ['Bruno · Retriever'], orders: 8, lifetime: 28640 },
  { id: 'u-farzana', name: 'Farzana Akter', area: 'Banani', city: 'Dhaka', phone: '+880 1713-000512', email: 'farzana@example.com', since: 'Aug 2024', pets: ['Luna · Husky'], orders: 21, lifetime: 72980, subscription: { name: 'NexGard Spectra', every: 30, next: '18 Oct' } },
  { id: 'u-imran', name: 'Imran Chowdhury', area: 'Uttara', city: 'Dhaka', phone: '+880 1714-000611', email: 'imran@example.com', since: 'Jun 2026', pets: ['Coco · Persian'], orders: 3, lifetime: 6450 },
  { id: 'u-sadia', name: 'Sadia Rahman', area: 'Mirpur', city: 'Dhaka', phone: '+880 1715-000777', email: 'sadia@example.com', since: 'Apr 2026', pets: ['Simba · Tabby'], orders: 5, lifetime: 14300, atRisk: true },
  { id: 'u-mahbub', name: 'Mahbub Alam', area: 'Bashundhara', city: 'Dhaka', phone: '+880 1716-000802', email: 'mahbub@example.com', since: 'Nov 2024', pets: ['Kitty · Siamese'], orders: 15, lifetime: 52100 },
  { id: 'u-rumana', name: 'Rumana Islam', area: 'Mohakhali', city: 'Dhaka', phone: '+880 1717-000930', email: 'rumana@example.com', since: 'Feb 2025', pets: ['Bella · Beagle'], orders: 9, lifetime: 30780, subscription: { name: 'Calming Probiotic', every: 30, next: '9 Oct' } },
  { id: 'u-arif', name: 'Arif Hossain', area: 'Lalmatia', city: 'Dhaka', phone: '+880 1718-001045', email: 'arif@example.com', since: 'Sep 2026', pets: ['Max · Pug'], orders: 1, lifetime: 850, isNew: true },
];

const d0 = (h, m) => at(h, m);
export const SAMPLE_APPOINTMENTS = [
  { id: 'a1', pet: 'Milo', reason: 'Skin check', vetId: 'v-sabrina', start: d0(9, 0), minutes: 60, mode: 'Clinic' },
  { id: 'a2', pet: 'Bella', reason: 'Follow-up', vetId: 'v-sabrina', start: d0(11, 0), minutes: 60, mode: 'Clinic', tentative: true },
  { id: 'a3', pet: 'Rocky', reason: 'Allergy plan', vetId: 'v-sabrina', start: d0(13, 0), minutes: 90, mode: 'Clinic' },
  { id: 'a4', pet: 'Coco', reason: 'Insulin review', vetId: 'v-tariq', start: d0(10, 0), minutes: 60, mode: 'Clinic' },
  { id: 'a5', pet: 'Max', reason: 'Lab results', vetId: 'v-tariq', start: d0(12, 0), minutes: 60, mode: 'Clinic', tentative: true },
  { id: 'a6', pet: 'Oreo', reason: 'Checkup', vetId: 'v-tariq', start: d0(14, 0), minutes: 60, mode: 'Clinic', tentative: true },
  { id: 'a7', pet: 'Simba', reason: 'Urgent triage', vetId: 'v-nadia', start: d0(9, 0), minutes: 90, mode: 'Clinic', urgent: true },
  { id: 'a8', pet: 'Luna', reason: 'Limping', vetId: 'v-nadia', start: d0(12, 0), minutes: 60, mode: 'Clinic' },
  { id: 'a9', pet: 'Kitty', reason: 'Anxiety', vetId: 'v-imran', start: d0(11, 0), minutes: 90, mode: 'Clinic' },
];

export const SAMPLE_REQUESTS = [
  { id: 'r1', customer: 'Rumana Islam', mode: 'Clinic', reason: 'Limping', pet: 'Bella', waitingMin: 4 },
  { id: 'r2', customer: 'Shafiq Anwar', mode: 'Clinic', reason: 'Vomiting', pet: 'Rocky', waitingMin: 2 },
];

export const SAMPLE_POSTS = [
  { id: 'post-amber', isAmberAlert: true, petName: 'Copper', petBreed: 'Beagle, 2.5 yrs (Male)', location: 'Gulshan Lake Park, Dhaka (near Road 11 bridge)', microchipId: '985141009827341', author: 'Pet Maya Alerts', time: at(today.getHours(), Math.max(0, today.getMinutes() - 30)), category: 'Lost & Found' },
  { id: 'post-1', author: 'Tanzim R.', petTag: 'Milo (Golden Retriever, 4 yrs)', category: 'Health & Recovery', title: "Milo's 8-week recovery after knee surgery", content: "We reached week 8 after Milo's TPLO surgery. Weeks 2–6 were crate rest and short lead walks, then hydrotherapy twice a week. His range of motion is almost back and he's allowed short off-lead walks again. Sharing our routine in case it helps anyone facing the same surgery.", likes: 84, comments: 19, time: at(today.getHours() - 3, 0), metrics: [{ label: 'Range of motion', value: 92 }, { label: 'Even weight-bearing', value: 88 }], vetNote: { by: 'Dr. Nazmul Hoda', text: 'Healing well. Cleared for gradual off-lead walking next fortnight.' } },
  { id: 'post-2', author: 'Sarah Ahmed', petTag: 'Bella (Persian Cat, 5 yrs)', category: 'Nutrition & GI', title: 'Switching Bella from regular kibble to a low-fat diet', content: 'For other Persian parents dealing with recurring tummy flare-ups: here is our 14-day stool score log after switching to a low-fat diet with a probiotic. Vomiting dropped noticeably within the first three days.', likes: 42, comments: 11, time: at(today.getHours() - 6, 0), scores: [6, 5, 4, 3, 3, 2, 2] },
];

export const SAMPLE_BLOGS = [
  { id: 'b-feature', featured: true, category: 'Nutrition', title: 'Beyond kibble: gut health in senior dogs', excerpt: 'What the research says about probiotics, fibre and diet changes for older dogs — and what to ask your vet before you switch foods.', author: 'Dr. Tariq Rahman', readMin: 7, date: 'Oct 2026' },
  { id: 'b1', category: 'Preventive care', title: 'Catching kidney disease early in cats', excerpt: 'Why an SDMA blood test can flag kidney changes before creatinine does, and when to ask for one.', author: 'Dr. Ananya Roy', readMin: 5, tone: 'beige' },
  { id: 'b2', category: 'Travel', title: 'Taking your pet abroad: a step-by-step checklist', excerpt: 'Microchips, rabies titre tests and the paperwork timeline for the UK, EU and UAE.', author: 'Pet Maya team', readMin: 9, tone: 'teal' },
  { id: 'b3', category: 'Pharmacy', title: 'Why vaccines must stay between 2°C and 8°C', excerpt: 'What happens to a vaccine that gets too warm in transit, and how we keep cold items cold.', author: 'Pet Maya pharmacy', readMin: 6, tone: 'beige' },
  { id: 'b4', category: 'Surgery', title: 'Cruciate ligament surgery: TPLO or lateral suture?', excerpt: 'How vets choose between the two most common repairs, and what recovery looks like for each.', author: 'Dr. Nazmul Hoda', readMin: 8, tone: 'teal' },
  { id: 'b5', category: 'Microchips', title: 'Which microchip does your pet need?', excerpt: 'ISO 11784/11785 chips explained — and why older 125 kHz chips can cause trouble at borders.', author: 'Pet Maya team', readMin: 4, tone: 'beige' },
  { id: 'b6', category: 'Parasites', title: 'Heartworm and ticks in South Asia', excerpt: 'A practical prevention calendar for Bangladesh’s climate, and the signs that need a vet visit.', author: 'Dr. Sabrina Karim', readMin: 6, tone: 'teal' },
];

export const SAMPLE_REVIEWS = [
  { name: 'Tanzim R.', pet: 'Milo', title: 'Zero flea flares in 8 months', text: "Milo's chewable arrived on time every month. The refill reminder is a lifesaver.", stars: 5 },
  { name: 'Farah K.', pet: 'Thor', title: 'Palatable & easy to dose', text: 'My German Shepherd usually rejects pills; he takes these like treats.', stars: 5 },
  { name: 'S. Ahsan', pet: 'Coco', title: 'Genuine stock, every time', text: 'Batch numbers on every box gave me peace of mind after a bad experience elsewhere.', stars: 5 },
];

export const SAMPLE_REVENUE_14D = [52, 64, 59, 74, 70, 82, 91, 79, 76, 88, 95, 86, 101, 118].map((k) => k * 1000);

export const SAMPLE_COLDCHAIN = [
  { order: 'PM-88902', customer: 'Nusrat J.', eta: '24 min', temp: 3.8 },
  { order: 'PM-88897', customer: 'Tanvir H.', eta: '41 min', temp: 4.1 },
  { order: 'PM-88891', customer: 'Farzana A.', eta: '58 min', temp: 7.9 },
  { order: 'PM-88885', customer: 'Imran C.', eta: '1 h 10', temp: 9.2 },
];

export const SAMPLE_COUPONS = [
  { id: 'c-welcome', code: 'MAYAFIRST', discountType: 'fixed', value: 200, minOrder: 1000, usageCount: 142, maxUsage: 500, active: true, expiresAt: Date.now() + 30 * 864e5, description: '৳200 off your first order' },
  { id: 'c-cold', code: 'COLD10', discountType: 'percent', value: 10, minOrder: 1500, usageCount: 68, maxUsage: 200, active: true, expiresAt: Date.now() + 15 * 864e5, description: '10% off cold-chain vaccines & meds' },
  { id: 'c-vet', code: 'VETCARE20', discountType: 'percent', value: 20, minOrder: 2000, usageCount: 94, maxUsage: 300, active: true, expiresAt: Date.now() + 45 * 864e5, description: '20% off vet consultations & Rx items' },
  { id: 'c-ship', code: 'FREESHIP', discountType: 'fixed', value: 100, minOrder: 800, usageCount: 312, maxUsage: 1000, active: true, expiresAt: Date.now() + 60 * 864e5, description: 'Free delivery on orders over ৳800' },
  { id: 'c-flash', code: 'FLASH500', discountType: 'fixed', value: 500, minOrder: 5000, usageCount: 15, maxUsage: 50, active: false, expiresAt: Date.now() - 2 * 864e5, description: '৳500 off high-value orders (Expired)' },
];
