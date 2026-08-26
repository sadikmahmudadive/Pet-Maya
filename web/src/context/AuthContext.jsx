import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  auth, 
  db, 
  googleProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  increment,
  arrayUnion,
  arrayRemove
} from '../config/firebase';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Generate clean referral code
  const generateReferralCode = (uid) => {
    const raw = (uid || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    return 'PM' + (raw.length >= 6 ? raw.slice(0, 6) : (raw + '89AC12').slice(0, 6));
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        localStorage.removeItem('pm_signed_out');
        localStorage.removeItem('pm_demo_user');

        const userDocRef = doc(db, 'users', user.uid);

        // Real-time listener on user profile document in Firestore
        const un有機 = onSnapshot(userDocRef, (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            setCurrentUser({
              uid: user.uid,
              name: data.name || user.displayName || 'Pet Parent',
              email: data.email || user.email,
              photoUrl: data.photoUrl || user.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
              role: data.role || 'Pet Owner',
              points: data.points ?? 25,
              referralCode: data.referralCode || generateReferralCode(user.uid),
              isVerified: data.isVerified ?? false,
              favoriteVetIds: data.favoriteVetIds || []
            });
          } else {
            // First time sign-up creation in Firestore
            const initialUserData = {
              uid: user.uid,
              name: user.displayName || 'Pet Parent',
              email: user.email,
              photoUrl: user.photoURL || '',
              role: 'Pet Owner',
              points: 25,
              referralCode: generateReferralCode(user.uid),
              isVerified: false,
              favoriteVetIds: [],
              createdAt: new Date().toISOString()
            };
            setDoc(userDocRef, initialUserData, { merge: true }).catch(() => {});
            setCurrentUser(initialUserData);
          }
          setLoading(false);
        }, (error) => {
          console.warn('[Firebase Auth] Firestore listener warning:', error);
          setCurrentUser({
            uid: user.uid,
            name: user.displayName || 'Pet Parent',
            email: user.email,
            photoUrl: user.photoURL || '',
            role: 'Pet Owner',
            points: 25,
            referralCode: generateReferralCode(user.uid),
            isVerified: false,
            favoriteVetIds: []
          });
          setLoading(false);
        });

        return () => un有機();
      } else {
        // No active Firebase user
        const savedDemo = localStorage.getItem('pm_demo_user');
        const isCurrentlySignedOut = localStorage.getItem('pm_signed_out') === 'true';
        if (savedDemo && !isCurrentlySignedOut) {
          try {
            setCurrentUser(JSON.parse(savedDemo));
          } catch (_) {
            setCurrentUser(null);
          }
        } else {
          setCurrentUser(null);
        }
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const loginWithEmail = async (email, password) => {
    localStorage.removeItem('pm_signed_out');
    localStorage.removeItem('pm_demo_user');
    return signInWithEmailAndPassword(auth, email, password);
  };

  const signupWithEmail = async (name, email, password, referralCode) => {
    localStorage.removeItem('pm_signed_out');
    localStorage.removeItem('pm_demo_user');
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    
    const userDocRef = doc(db, 'users', cred.user.uid);
    const newUserData = {
      uid: cred.user.uid,
      name,
      email,
      photoUrl: '',
      role: 'Pet Owner',
      points: 25,
      referralCode: generateReferralCode(cred.user.uid),
      referredBy: referralCode ? referralCode.trim() : null,
      isVerified: false,
      favoriteVetIds: [],
      createdAt: new Date().toISOString()
    };

    await setDoc(userDocRef, newUserData, { merge: true });
    return cred;
  };

  const loginWithGoogle = async () => {
    localStorage.removeItem('pm_signed_out');
    localStorage.removeItem('pm_demo_user');
    const result = await signInWithPopup(auth, googleProvider);
    const userDocRef = doc(db, 'users', result.user.uid);
    const snap = await getDoc(userDocRef);

    if (!snap.exists()) {
      await setDoc(userDocRef, {
        uid: result.user.uid,
        name: result.user.displayName || 'Pet Parent',
        email: result.user.email,
        photoUrl: result.user.photoURL || '',
        role: 'Pet Owner',
        points: 25,
        referralCode: generateReferralCode(result.user.uid),
        isVerified: false,
        favoriteVetIds: [],
        createdAt: new Date().toISOString()
      }, { merge: true });
    }
    return result;
  };

  const loginAsGuest = (role = 'Pet Owner') => {
    localStorage.removeItem('pm_signed_out');
    const guestUser = {
      uid: 'demo_guest_' + Date.now(),
      name: 'Alex Johnson (Demo)',
      email: 'alex.demo@petmaya.app',
      photoUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
      role: role,
      points: 50,
      referralCode: 'PM89AC12',
      isVerified: true,
      favoriteVetIds: ['v1', 'v2']
    };
    localStorage.setItem('pm_demo_user', JSON.stringify(guestUser));
    setCurrentUser(guestUser);
  };

  const logout = async () => {
    localStorage.setItem('pm_signed_out', 'true');
    localStorage.removeItem('pm_demo_user');
    setCurrentUser(null);
    try {
      await signOut(auth);
    } catch (_) {}
  };

  const awardPoints = async (amount = 5) => {
    if (!currentUser) return;
    if (currentUser.uid.startsWith('demo_guest')) {
      setCurrentUser(prev => ({ ...prev, points: (prev?.points || 0) + amount }));
      return;
    }
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, { points: increment(amount) });
    } catch (e) {
      console.warn('[Firebase] Award points error:', e);
    }
  };

  const toggleFavoriteVet = async (vetId) => {
    if (!currentUser) return;
    const isFav = currentUser.favoriteVetIds?.includes(vetId);
    
    if (currentUser.uid.startsWith('demo_guest')) {
      setCurrentUser(prev => ({
        ...prev,
        favoriteVetIds: isFav 
          ? prev.favoriteVetIds.filter(id => id !== vetId) 
          : [...(prev.favoriteVetIds || []), vetId]
      }));
      return;
    }

    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, {
        favoriteVetIds: isFav ? arrayRemove(vetId) : arrayUnion(vetId)
      });
    } catch (e) {
      console.warn('[Firebase] Toggle favorite vet error:', e);
    }
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      loading,
      loginWithEmail,
      signupWithEmail,
      loginWithGoogle,
      loginAsGuest,
      logout,
      awardPoints,
      toggleFavoriteVet
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
