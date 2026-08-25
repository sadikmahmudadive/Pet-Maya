import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  updateProfile,
  sendPasswordResetEmail,
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot,
  increment,
  addDoc
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDjikCtm7RK1CoebQMGQIQTAPh-cC23B-Q",
  authDomain: "pet-maya.firebaseapp.com",
  projectId: "pet-maya",
  storageBucket: "pet-maya.firebasestorage.app",
  messagingSenderId: "335402911476",
  appId: "1:335402911476:web:841262770bb408768a00a1",
  measurementId: "G-WSN2ZQE4PF"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
  onAuthStateChanged,
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  increment,
  addDoc
};

// ── INITIAL SEED DATA FOR DEMO & INSTANT RENDERING ──
export const INITIAL_PETS = [
  { id: 'pet-1', name: 'Max', species: 'Dog', breed: 'Golden Retriever', gender: 'Male', age: '3 Yrs', weight: '28.4 kg', photo: 'assets/images/Pet_1.jpg', microchip: 'PM-99482-GOLD', nextVaccine: '2026-09-15' },
  { id: 'pet-2', name: 'Luna', species: 'Cat', breed: 'British Shorthair', gender: 'Female', age: '2 Yrs', weight: '4.2 kg', photo: 'assets/images/Pet_2.jpg', microchip: 'PM-11823-BRIT', nextVaccine: '2026-10-02' }
];

export const INITIAL_VETS = [
  { id: 'v1', name: 'Dr. Sarah Jenkins', qualification: 'DVM, MRCVS • Small Animal Surgery', tag: 'Veterinarian', rating: 4.9, reviewsCount: 68, distance: '1.2 km away', price: '৳35/visit', availability: 'Mon - Fri • 9am - 6pm', verified: true, isVerified: true, bio: '12+ years clinical experience in orthopedics, emergency soft tissue surgery, and canine preventative care.', photo: 'assets/images/Pet_1.jpg', clinic: 'Greenwood Animal Hospital' },
  { id: 'v2', name: 'Dr. Aris Thorne', qualification: 'BVSc, PhD • Feline Medicine & Dermatology', tag: 'Veterinarian', rating: 5.0, reviewsCount: 42, distance: '2.8 km away', price: '৳45/visit', availability: 'Tue - Sat • 10am - 7pm', verified: true, isVerified: true, bio: 'Specialist in feline chronic kidney disease, allergic dermatitis, and clinical cytology diagnostics.', photo: 'assets/images/Pet_2.jpg', clinic: 'Metropolitan Veterinary Center' },
  { id: 'v3', name: 'Dr. Emily Vance', qualification: 'DVM • Internal Medicine & Cardiology', tag: 'Veterinarian', rating: 4.8, reviewsCount: 51, distance: '3.5 km away', price: '৳40/visit', availability: 'Daily • 8am - 4pm', verified: true, isVerified: true, bio: 'Expert in echocardiography, metabolic triage, and comprehensive canine/feline cardiac disease management.', photo: 'assets/images/Pet_1.jpg', clinic: 'City Vets & Diagnostics' },
  { id: 'v4', name: 'Pawfect Spa & Grooming', qualification: 'Master Groomer Certified • Hydrobath & Styling', tag: 'Grooming Spa', rating: 4.9, reviewsCount: 89, distance: '0.8 km away', price: '৳25/session', availability: 'Mon - Sun • 9am - 8pm', verified: true, isVerified: true, bio: 'Deluxe stress-free grooming, flea & tick therapeutic baths, and precision breed breed styling.', photo: 'assets/images/Pet_2.jpg', clinic: 'Pawfect Pet Wellness Studio' },
  { id: 'v5', name: 'Happy Tails Luxury Boarding', qualification: '24/7 Monitored Pet Hotel & Agility Park', tag: 'Boarding Resort', rating: 4.9, reviewsCount: 112, distance: '4.1 km away', price: '৳30/night', availability: '24/7 Check-in', verified: true, isVerified: true, bio: 'Climate-controlled suites, live webcams, individualized playtime, and on-call veterinary supervision.', photo: 'assets/images/Pet_1.jpg', clinic: 'Happy Tails Resort' },
  { id: 'v6', name: 'Apex Pet Supplies & Pharmacy', qualification: 'Licensed Veterinary Pharmacy & Specialty Diet Depot', tag: 'Pet Shop', rating: 4.8, reviewsCount: 94, distance: '1.5 km away', price: 'Free Delivery', availability: 'Daily • 8am - 10pm', verified: true, isVerified: true, bio: 'Prescription veterinary diets, authentic tick/flea preventatives, supplements, and premium accessories.', photo: 'assets/images/Pet_2.jpg', clinic: 'Apex Pet Hub' }
];

export const INITIAL_PRODUCTS = [
  { id: 'p1', name: 'Royal Canin Golden Retriever Adult', category: 'food', price: 64.99, rating: 4.9, ratingCount: 128, image: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=500&auto=format&fit=crop&q=80', description: 'Tailored kibble designed specifically for the cardiac health and coat barrier of adult Golden Retrievers.' },
  { id: 'p2', name: 'Simparica Trio Chewables (3-Pack)', category: 'pharma', price: 42.50, rating: 5.0, ratingCount: 215, image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=80', description: 'All-in-one monthly protection against fleas, ticks, heartworm disease, roundworms, and hookworms.' },
  { id: 'p3', name: 'Smart GPS & Health Collar V3', category: 'tech', price: 89.00, rating: 4.8, ratingCount: 76, image: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=500&auto=format&fit=crop&q=80', description: 'Real-time cellular GPS tracking, geofence escape alarms, activity telemetry, and sound buzzer collar.' },
  { id: 'p4', name: 'Purina Pro Plan LiveClear Cat Food', category: 'food', price: 48.99, rating: 4.9, ratingCount: 88, image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=500&auto=format&fit=crop&q=80', description: 'Revolutionary feline nutrition that safely neutralizes Fel d 1 allergen in cat saliva and dander.' },
  { id: 'p5', name: 'Orthopedic Memory Foam Pet Bed', category: 'supplies', price: 54.00, rating: 4.7, ratingCount: 92, image: 'https://images.unsplash.com/photo-1541599540903-216a46ca1dc0?w=500&auto=format&fit=crop&q=80', description: 'High-density memory foam base with waterproof lining designed for joint relief and deep recovery sleep.' },
  { id: 'p6', name: 'Otomax Clinical Ear Drops (15g)', category: 'pharma', price: 28.00, rating: 4.9, ratingCount: 64, image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=500&auto=format&fit=crop&q=80', description: 'Veterinary prescription anti-inflammatory, antifungal, and antibacterial suspension for canine otitis.' }
];

export const INITIAL_POSTS = [
  {
    id: 'post-1',
    author: 'Alex Johnson',
    authorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
    petTag: 'Max (Golden Retriever)',
    timestamp: '2 hours ago',
    content: 'Max completed his agility championship sprint today! Huge shoutout to Dr. Sarah Jenkins for his joint health routine. 🐾🏅',
    image: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=600&auto=format&fit=crop&q=80',
    likes: 24,
    likedByMe: false,
    comments: [
      { author: 'Dr. Sarah Jenkins', text: 'So proud of Max! Keep up the daily joint mobility exercises!' }
    ]
  },
  {
    id: 'post-2',
    author: 'Elena Vance',
    authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
    petTag: 'Luna (British Shorthair)',
    timestamp: '5 hours ago',
    content: 'Just tried the AI Health Diagnostic scanner for Luna’s tear staining. Super detailed first aid advice before our vet visit! ✨',
    image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600&auto=format&fit=crop&q=80',
    likes: 19,
    likedByMe: false,
    comments: []
  }
];
