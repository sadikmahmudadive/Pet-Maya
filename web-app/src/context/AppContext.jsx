import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  INITIAL_PETS, 
  INITIAL_VETS, 
  INITIAL_PRODUCTS, 
  INITIAL_POSTS 
} from '../config/firebase';

const AppContext = createContext();

export function AppProvider({ children }) {
  // Navigation
  const [activeTab, setActiveTab] = useState('dashboard');
  const [theme, setTheme] = useState(() => localStorage.getItem('pm_theme') || 'dark');

  // Modals & Drawers
  const [activeModal, setActiveModal] = useState(null);
  const [modalData, setModalData] = useState(null);

  // Core Datasets
  const [pets, setPets] = useState(() => {
    const saved = localStorage.getItem('pm_pets');
    return saved ? JSON.parse(saved) : INITIAL_PETS;
  });

  const [vets, setVets] = useState(() => {
    const saved = localStorage.getItem('pm_vets');
    return saved ? JSON.parse(saved) : INITIAL_VETS;
  });

  const [products] = useState(INITIAL_PRODUCTS);

  const [posts, setPosts] = useState(() => {
    const saved = localStorage.getItem('pm_posts');
    return saved ? JSON.parse(saved) : INITIAL_POSTS;
  });

  const [appointments, setAppointments] = useState(() => {
    const saved = localStorage.getItem('pm_appointments');
    return saved ? JSON.parse(saved) : [
      { id: 'apt-1', title: 'Annual Nobivac Booster with Dr. Sarah Jenkins', doctor: 'Dr. Sarah Jenkins', petName: 'Max', date: '2026-08-28', time: '10:30 AM', mode: 'In-Clinic Consultation', status: 'Confirmed' }
    ];
  });

  const [medicalRecords, setMedicalRecords] = useState(() => {
    const saved = localStorage.getItem('pm_ehr');
    return saved ? JSON.parse(saved) : [
      { id: 'ehr-1', petName: 'Bella', ownerName: 'Alex Johnson', serviceType: 'Consultation', weight: '14.2 kg', diagnosis: 'Otitis Externa (mild fungal ear canal infection)', prescription: 'Otomax Drops 4 drops 2x daily (7 days). Apoquel 16mg daily.', cost: 45, date: '2026-08-15', nextBooster: '2026-08-25' },
      { id: 'ehr-2', petName: 'Max', ownerName: 'Alex Johnson', serviceType: 'Vaccination', weight: '28.4 kg', diagnosis: 'Routine Annual Immunization', prescription: 'Nobivac DHPP + Rabies 1ml SC administered.', cost: 35, date: '2026-08-10', nextBooster: '2027-08-10' }
    ];
  });

  // E-Commerce Cart
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('pm_cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  // Orders
  const [orders, setOrders] = useState(() => {
    const saved = localStorage.getItem('pm_orders');
    return saved ? JSON.parse(saved) : [
      {
        id: 'PM-ORD-8941',
        date: '2026-08-24',
        items: [{ id: 'p1', name: 'Royal Canin Golden Retriever Adult', price: 64.99, qty: 1 }],
        total: 64.99,
        status: 'In Preparation',
        address: 'House 14, Road 7, Banani, Dhaka'
      }
    ];
  });

  // Toasts
  const [toasts, setToasts] = useState([]);

  // Theme synchronization
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    localStorage.setItem('pm_theme', theme);
  }, [theme]);

  // Persist State Changes
  useEffect(() => { localStorage.setItem('pm_pets', JSON.stringify(pets)); }, [pets]);
  useEffect(() => { localStorage.setItem('pm_vets', JSON.stringify(vets)); }, [vets]);
  useEffect(() => { localStorage.setItem('pm_posts', JSON.stringify(posts)); }, [posts]);
  useEffect(() => { localStorage.setItem('pm_appointments', JSON.stringify(appointments)); }, [appointments]);
  useEffect(() => { localStorage.setItem('pm_ehr', JSON.stringify(medicalRecords)); }, [medicalRecords]);
  useEffect(() => { localStorage.setItem('pm_cart', JSON.stringify(cart)); }, [cart]);
  useEffect(() => { localStorage.setItem('pm_orders', JSON.stringify(orders)); }, [orders]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const showToast = (msg, type = 'info') => {
    const id = Date.now() + Math.random().toString(36).substr(2, 4);
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  };

  const openModal = (modalName, data = null) => {
    setActiveModal(modalName);
    setModalData(data);
  };

  const closeModal = () => {
    setActiveModal(null);
    setModalData(null);
  };

  // Pets
  const addPet = (newPet) => {
    const pet = {
      id: 'pet_' + Date.now(),
      name: newPet.name || 'Buddy',
      species: newPet.species || 'Dog',
      breed: newPet.breed || 'Mixed',
      gender: newPet.gender || 'Male',
      age: newPet.age || '1 Yr',
      weight: newPet.weight ? `${newPet.weight} kg` : '10 kg',
      photo: newPet.photo || 'assets/images/Pet_1.jpg',
      microchip: `PM-${Math.floor(10000 + Math.random() * 90000)}`,
      nextVaccine: '2026-11-20'
    };
    setPets(prev => [pet, ...prev]);
    showToast(`🐾 ${pet.name} added to your pet family!`, 'success');
  };

  const removePet = (id) => {
    setPets(prev => prev.filter(p => p.id !== id));
    showToast('Pet profile removed.');
  };

  // Vets
  const updateVetPrice = (vetId, newPrice) => {
    setVets(prev => prev.map(v => v.id === vetId ? { ...v, price: newPrice } : v));
    showToast('Consultation fee updated successfully!', 'success');
  };

  const addVetReview = (vetId, rating, comment, authorName) => {
    setVets(prev => prev.map(v => {
      if (v.id === vetId) {
        const newCount = (v.reviewsCount || 0) + 1;
        const newRating = Number((((v.rating * (newCount - 1)) + rating) / newCount).toFixed(1));
        return { ...v, rating: newRating, reviewsCount: newCount };
      }
      return v;
    }));
    showToast('⭐ Thank you for your review!', 'success');
  };

  // Cart
  const addToCart = (product, qty = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + qty } : item);
      }
      return [...prev, { ...product, qty }];
    });
    showToast(`🛒 Added ${product.name} to cart!`, 'success');
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateCartQty = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.qty + delta;
        return newQty > 0 ? { ...item, qty: newQty } : null;
      }
      return item;
    }).filter(Boolean));
  };

  const clearCart = () => {
    setCart([]);
    setAppliedCoupon(null);
  };

  const applyCoupon = (code) => {
    const clean = code.trim().toUpperCase();
    if (clean === 'PETMAYA10') {
      setAppliedCoupon({ code: clean, discountPct: 0.10, label: '10% Off' });
      showToast('🎉 Promo code PETMAYA10 applied (10% Off)!', 'success');
      return true;
    } else if (clean === 'FREESHIP') {
      setAppliedCoupon({ code: clean, freeShipping: true, label: 'Free Shipping' });
      showToast('🚚 Promo code FREESHIP applied!', 'success');
      return true;
    } else {
      showToast('Invalid promo code. Try PETMAYA10 or FREESHIP', 'error');
      return false;
    }
  };

  // Orders
  const placeOrder = (orderData) => {
    const newOrder = {
      id: `PM-ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toISOString().split('T')[0],
      items: [...cart],
      total: orderData.total,
      status: 'Placed',
      address: orderData.address || 'Dhaka, Bangladesh',
      paymentMethod: orderData.paymentMethod || 'Cash on Delivery'
    };
    setOrders(prev => [newOrder, ...prev]);
    clearCart();
    closeModal();
    openModal('orderTracker', newOrder);
    showToast('🎉 Order placed successfully!', 'success');
  };

  // Appointments
  const addAppointment = (apt) => {
    const item = {
      id: 'apt_' + Date.now(),
      title: apt.title || `Appointment with ${apt.doctor}`,
      doctor: apt.doctor,
      petName: apt.petName || 'Max',
      date: apt.date || '2026-08-30',
      time: apt.time || '11:00 AM',
      mode: apt.mode || 'In-Clinic Consultation',
      status: 'Confirmed'
    };
    setAppointments(prev => [item, ...prev]);
    closeModal();
    showToast('📅 Appointment scheduled & synced with Google/Apple Calendar!', 'success');
  };

  const removeAppointment = (id) => {
    setAppointments(prev => prev.filter(a => a.id !== id));
    showToast('Appointment cancelled.');
  };

  // Medical Records
  const addMedicalRecord = (rec) => {
    const item = {
      id: 'ehr_' + Date.now(),
      petName: rec.petName || 'Bella',
      ownerName: rec.ownerName || 'Alex Johnson',
      serviceType: rec.serviceType || 'Consultation',
      weight: rec.weight || '14.0 kg',
      diagnosis: rec.diagnosis || 'Routine clinical exam',
      prescription: rec.prescription || 'N/A',
      cost: rec.cost || 40,
      date: rec.date || new Date().toISOString().split('T')[0],
      nextBooster: rec.nextBooster || '2027-08-25'
    };
    setMedicalRecords(prev => [item, ...prev]);
    closeModal();
    showToast('📋 Clinical record saved and synced to patient digital passport!', 'success');
  };

  // Community
  const createPost = (newPost) => {
    const item = {
      id: 'post_' + Date.now(),
      author: newPost.author || 'Alex Johnson',
      authorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
      petTag: newPost.petTag || 'Max (Golden Retriever)',
      timestamp: 'Just now',
      content: newPost.content,
      image: newPost.image || '',
      likes: 0,
      likedByMe: false,
      comments: []
    };
    setPosts(prev => [item, ...prev]);
    showToast('🌟 Community post shared!', 'success');
  };

  const toggleLike = (postId) => {
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        const liked = !p.likedByMe;
        return { ...p, likedByMe: liked, likes: liked ? p.likes + 1 : p.likes - 1 };
      }
      return p;
    }));
  };

  const addComment = (postId, text, authorName = 'Alex Johnson') => {
    if (!text.trim()) return;
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return { ...p, comments: [...p.comments, { author: authorName, text: text.trim() }] };
      }
      return p;
    }));
    showToast('Comment posted!');
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const cartCount = cart.reduce((count, item) => count + item.qty, 0);

  const value = {
    activeTab,
    setActiveTab,
    theme,
    toggleTheme,
    activeModal,
    modalData,
    openModal,
    closeModal,
    pets,
    addPet,
    removePet,
    vets,
    updateVetPrice,
    addVetReview,
    products,
    cart,
    cartCount,
    cartTotal,
    appliedCoupon,
    addToCart,
    removeFromCart,
    updateCartQty,
    clearCart,
    applyCoupon,
    orders,
    placeOrder,
    appointments,
    addAppointment,
    removeAppointment,
    medicalRecords,
    addMedicalRecord,
    posts,
    createPost,
    toggleLike,
    addComment,
    toasts,
    showToast
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
