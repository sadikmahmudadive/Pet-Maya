import { initializeApp } from 'firebase/app';
import { 
  initializeAuth,
  indexedDBLocalPersistence,
  browserLocalPersistence,
  browserPopupRedirectResolver,
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup as firebaseSignInWithPopup, 
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
  deleteDoc,
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  onSnapshot,
  increment,
  addDoc,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  deleteField
} from 'firebase/firestore';
import { 
  getStorage, 
  ref, 
  uploadBytesResumable, 
  getDownloadURL 
} from 'firebase/storage';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';

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

// App Check proves requests come from this site (not scripts/bots), which lets
// Firestore, Storage and Functions enforce it. Set VITE_APPCHECK_RECAPTCHA_KEY
// to a reCAPTCHA Enterprise site key registered in Firebase → App Check.
const appCheckKey = import.meta.env.VITE_APPCHECK_RECAPTCHA_KEY;
if (appCheckKey) {
  try {
    initializeAppCheck(app, { provider: new ReCaptchaEnterpriseProvider(appCheckKey), isTokenAutoRefreshEnabled: true });
  } catch (e) {
    console.warn('[Firebase] App Check not started:', e);
  }
}
// initializeAuth without a popup/redirect resolver: getAuth() would load Google's gapi script and a
// hidden auth iframe (~130 KB) on every page view, even for visitors who never sign in. The resolver is
// passed only when someone actually clicks "Continue with Google" (see signInWithPopup below).
export const auth = initializeAuth(app, { persistence: [indexedDBLocalPersistence, browserLocalPersistence] });
export const signInWithPopup = (authInstance, provider) => firebaseSignInWithPopup(authInstance, provider, browserPopupRedirectResolver);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app, 'us-central1');
export const googleProvider = new GoogleAuthProvider();

export {
  httpsCallable,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
  onAuthStateChanged,
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  increment,
  addDoc,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  deleteField,
  ref,
  uploadBytesResumable,
  getDownloadURL
};

// ── INITIAL DATA STRUCTURES (CLEAN EMPTY DEFAULTS CONNECTED TO FIRESTORE) ──
export const INITIAL_PETS = [];
export const INITIAL_VETS = [];
export const INITIAL_PRODUCTS = [];
export const INITIAL_POSTS = [];

