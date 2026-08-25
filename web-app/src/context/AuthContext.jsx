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
  increment
} from '../config/firebase';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Generate clean 8-char referral code
  const generateReferralCode = (uid) => {
    const raw = (uid || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    return 'PM' + (raw.length >= 6 ? raw.slice(0, 6) : (raw + '89AC12').slice(0, 6));
  };

  useEffect(() => {
    // Check local demo session first
    const savedDemo = localStorage.getItem('pm_demo_user');
    if (savedDemo) {
      try {
        setCurrentUser(JSON.parse(savedDemo));
        setLoading(false);
        return;
      } catch (e) {}
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userRef = doc(db, 'users', user.uid);
          const snap = await getDoc(userRef);

          if (snap.exists()) {
            const data = snap.data();
            setCurrentUser({
              uid: user.uid,
              name: data.name || user.displayName || 'Pet Parent',
              email: data.email || user.email,
              photoUrl: data.photoUrl || user.photoURL || '',
              role: data.role || 'Pet Owner',
              points: data.points ?? 15,
              referralCode: data.referralCode || generateReferralCode(user.uid),
              isVerified: data.isVerified ?? false,
              favoriteVetIds: data.favoriteVetIds || []
            });
          } else {
            const newUser = {
              uid: user.uid,
              name: user.displayName || 'Pet Parent',
              email: user.email,
              photoUrl: user.photoURL || '',
              role: 'Pet Owner',
              points: 15,
              referralCode: generateReferralCode(user.uid),
              isVerified: false,
              favoriteVetIds: []
            };
            await setDoc(userRef, newUser, { merge: true });
            setCurrentUser(newUser);
          }
        } catch (e) {
          // Fallback user profile
          setCurrentUser({
            uid: user.uid,
            name: user.displayName || 'Alex Johnson',
            email: user.email,
            photoUrl: user.photoURL || '',
            role: 'Pet Owner',
            points: 15,
            referralCode: generateReferralCode(user.uid),
            isVerified: false,
            favoriteVetIds: []
          });
        }
      } else {
        // Default to Demo Guest User
        const defaultGuest = {
          uid: 'demo_user_001',
          name: 'Alex Johnson',
          email: 'alex@petmaya.app',
          photoUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
          role: 'Pet Owner',
          points: 45,
          referralCode: 'PM89AC12',
          isVerified: true,
          favoriteVetIds: ['v1', 'v2']
        };
        setCurrentUser(defaultGuest);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const loginWithEmail = async (email, password) => {
    localStorage.removeItem('pm_demo_user');
    return signInWithEmailAndPassword(auth, email, password);
  };

  const signupWithEmail = async (name, email, password, referralCode) => {
    localStorage.removeItem('pm_demo_user');
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    const myCode = generateReferralCode(cred.user.uid);
    const userData = {
      uid: cred.user.uid,
      name,
      email,
      photoUrl: '',
      role: 'Pet Owner',
      points: 15,
      referralCode: myCode,
      isVerified: false,
      favoriteVetIds: []
    };
    if (referralCode) {
      userData.referredBy = referralCode.trim().toUpperCase();
    }
    await setDoc(doc(db, 'users', cred.user.uid), userData, { merge: true });
    setCurrentUser(userData);
    return cred;
  };

  const loginWithGoogle = async () => {
    localStorage.removeItem('pm_demo_user');
    return signInWithPopup(auth, googleProvider);
  };

  const loginAsGuest = (role = 'Pet Owner') => {
    const demoUser = {
      uid: 'demo_user_001',
      name: role === 'Veterinarian' ? 'Dr. Sarah Jenkins' : (role === 'Shop Merchant' ? 'Apex Store Manager' : 'Alex Johnson'),
      email: 'alex@petmaya.app',
      photoUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
      role,
      points: 45,
      referralCode: 'PM89AC12',
      isVerified: true,
      favoriteVetIds: ['v1', 'v2']
    };
    localStorage.setItem('pm_demo_user', JSON.stringify(demoUser));
    setCurrentUser(demoUser);
  };

  const switchRole = async (newRole) => {
    if (!currentUser) return;
    const updated = { ...currentUser, role: newRole };
    setCurrentUser(updated);
    if (currentUser.uid === 'demo_user_001') {
      localStorage.setItem('pm_demo_user', JSON.stringify(updated));
    } else {
      try {
        await updateDoc(doc(db, 'users', currentUser.uid), { role: newRole });
      } catch (e) {}
    }
  };

  const logout = async () => {
    localStorage.removeItem('pm_demo_user');
    try {
      await signOut(auth);
    } catch (e) {}
    loginAsGuest('Pet Owner');
  };

  const sendPasswordReset = async (email) => {
    return sendPasswordResetEmail(auth, email);
  };

  const awardPoints = async (pts, reason = 'Activity reward') => {
    if (!currentUser) return;
    const newPoints = (currentUser.points || 0) + pts;
    const updated = { ...currentUser, points: newPoints };
    setCurrentUser(updated);
    if (currentUser.uid === 'demo_user_001') {
      localStorage.setItem('pm_demo_user', JSON.stringify(updated));
    } else {
      try {
        await updateDoc(doc(db, 'users', currentUser.uid), {
          points: increment(pts)
        });
      } catch (e) {}
    }
  };

  const toggleFavoriteVet = async (vetId) => {
    if (!currentUser) return;
    const currentFavs = currentUser.favoriteVetIds || [];
    const isFav = currentFavs.includes(vetId);
    const updatedFavs = isFav ? currentFavs.filter(id => id !== vetId) : [...currentFavs, vetId];
    const updated = { ...currentUser, favoriteVetIds: updatedFavs };
    setCurrentUser(updated);
    if (currentUser.uid !== 'demo_user_001') {
      try {
        await updateDoc(doc(db, 'users', currentUser.uid), { favoriteVetIds: updatedFavs });
      } catch (e) {}
    }
  };

  const value = {
    currentUser,
    loading,
    loginWithEmail,
    signupWithEmail,
    loginWithGoogle,
    loginAsGuest,
    switchRole,
    logout,
    sendPasswordReset,
    awardPoints,
    toggleFavoriteVet
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
