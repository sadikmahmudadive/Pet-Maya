import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { useMyPets, useProducts, useMyOrders, useVets, useCoupons } from '../data/hooks.js';
import { addDocument, useDoc } from '../data/firestore.js';
import { decrementStock, incrementCouponUsage, awardPoints, notify, syncWishlist, isRealUser } from '../data/actions.js';
import { DELIVERY, PROMOS } from '../data/content.js';
import { track, toItem, trackContext } from './analytics.js';
import { functions, httpsCallable } from '../config/firebase';

const StoreCtx = createContext(null);

const read = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d; } catch { return d; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode */ } };

const lineKey = (id, variant) => `${id}::${variant || ''}`;

export function StoreProvider({ children }) {
  const { currentUser } = useAuth() || {};
  const themeCtx = useTheme();
  const products = useProducts();
  const vets = useVets();
  const coupons = useCoupons();
  const pets = useMyPets(currentUser);
  const myOrders = useMyOrders(currentUser);

  const profile = useDoc('users', currentUser?.uid, { enabled: isRealUser(currentUser) });

  const [cart, setCart] = useState(() => read('pm_cart', []).map((i) => ({ ...i, qty: Number(i.qty || i.quantity) || 1 })));
  const [coupon, setCoupon] = useState(() => read('pm_coupon', null));
  const [bagOpen, setBagOpen] = useState(false);
  const [wishlist, setWishlist] = useState(() => read('pm_wishlist', []));
  const [petId, setPetId] = useState(() => read('pm_active_pet', null));
  const [localOrders, setLocalOrders] = useState(() => read('pm_orders_v2', []));
  const [toasts, setToasts] = useState([]);
  const toastId = useRef(0);

  useEffect(() => write('pm_cart', cart), [cart]);
  useEffect(() => write('pm_coupon', coupon), [coupon]);
  useEffect(() => write('pm_wishlist', wishlist), [wishlist]);
  useEffect(() => write('pm_active_pet', petId), [petId]);
  useEffect(() => write('pm_orders_v2', localOrders), [localOrders]);

  const toast = useCallback((message, opts = {}) => {
    const id = ++toastId.current;
    setToasts((t) => [...t, { id, message, ...opts }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), opts.duration || 4200);
  }, []);
  const dismissToast = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const addToCart = useCallback((p, { qty = 1, variant = '', variantLabel = '', coursePacks = 1, courseSavePct = 0, basePrice = null, sku = '', open = true, silent = false } = {}) => {
    const key = lineKey(p.id, variant);
    let prev;
    setCart((c) => {
      prev = c;
      const hit = c.find((i) => lineKey(i.id, i.variant) === key);
      if (hit) return c.map((i) => (lineKey(i.id, i.variant) === key ? { ...i, qty: i.qty + qty } : i));
      return [...c, {
        id: p.id,
        name: p.name,
        brand: p.brand,
        sku: sku || p.sku || '',
        price: Number(p.price) || 0,
        basePrice: Number(basePrice ?? p.basePrice ?? p.price) || 0,
        compareAt: p.compareAt || null,
        image: p.image || '',
        isRx: !!p.isRx,
        coldChain: !!p.coldChain,
        subscribe: !!p.subscribe,
        coursePacks: Number(coursePacks || p.coursePacks) || 1,
        courseSavePct: Number(courseSavePct || p.courseSavePct) || 0,
        variant,
        variantLabel: variantLabel || p.variantLabel || variant,
        qty,
      }];
    });
    track('add_to_cart', { value: (Number(p.price) || 0) * qty, items: [toItem(p, qty)] });
    if (open) setBagOpen(true);
    if (!silent) toast(`${p.name} added to your care bag`, { undo: () => setCart(prev) });
  }, [toast]);

  const setQty = useCallback((id, variant, qty) => {
    setCart((c) => (qty <= 0
      ? c.filter((i) => lineKey(i.id, i.variant) !== lineKey(id, variant))
      : c.map((i) => (lineKey(i.id, i.variant) === lineKey(id, variant) ? { ...i, qty } : i))));
  }, []);
  const removeLine = useCallback((id, variant) => setQty(id, variant, 0), [setQty]);
  const clearCart = useCallback(() => setCart([]), []);

  const applyCoupon = useCallback((code) => {
    const c = String(code || '').trim().toUpperCase();
    if (!c) return false;
    const subtotal = cart.reduce((a, i) => a + i.price * i.qty, 0);

    // Check live / sample Firestore coupons collection first
    const match = (coupons.items || []).find((x) => String(x.code || '').toUpperCase() === c);
    if (match) {
      const expired = match.expiresAt && match.expiresAt <= Date.now();
      const exhausted = match.maxUsage && (match.usageCount || 0) >= match.maxUsage;
      if (match.active === false || expired || exhausted) {
        toast(`Promo code ${c} is no longer active`, { tone: 'error' });
        return false;
      }
      if (match.minOrder && subtotal < Number(match.minOrder)) {
        toast(`Add ৳${(Number(match.minOrder) - subtotal).toLocaleString('en-US')} more to use ${c} (min ৳${Number(match.minOrder).toLocaleString('en-US')})`, { tone: 'error' });
        return false;
      }
      const isFreeShip = c === 'FREESHIP';
      setCoupon({
        id: match.id,
        code: c,
        discountType: match.discountType || 'fixed',
        value: Number(match.value) || 0,
        pct: match.discountType === 'percent' ? Number(match.value) || 0 : 0,
        minOrder: Number(match.minOrder) || 0,
        freeShipping: isFreeShip,
      });
      return true;
    }

    // Built-in fallback promo codes
    if (c === PROMOS.firstOrderCode || c === 'MAYA10') {
      setCoupon({ code: c, discountType: 'percent', value: PROMOS.firstOrderPct, pct: PROMOS.firstOrderPct, minOrder: 0 });
      return true;
    }
    if (c === 'FREESHIP') {
      setCoupon({ code: c, discountType: 'fixed', value: 0, pct: 0, freeShipping: true, minOrder: 0 });
      return true;
    }
    return false;
  }, [cart, coupons.items, toast]);

  const totals = useMemo(() => {
    const subtotal = cart.reduce((a, i) => a + i.price * i.qty, 0);
    let discount = 0;
    if (coupon && (!coupon.minOrder || subtotal >= coupon.minOrder)) {
      if (coupon.discountType === 'fixed' && !coupon.freeShipping) {
        discount = Math.min(subtotal, Math.round(Number(coupon.value) || 0));
      } else if (coupon.pct || coupon.discountType === 'percent') {
        const pct = Number(coupon.pct || coupon.value) || 0;
        discount = Math.round((subtotal * pct) / 100);
      }
    }
    const needsCold = cart.some((i) => i.coldChain);
    const freeShip = coupon?.freeShipping || subtotal - discount >= DELIVERY.freeOver;
    const shipping = cart.length === 0 || freeShip ? 0 : DELIVERY.insideDhakaFee;
    const count = cart.reduce((a, i) => a + i.qty, 0);
    const needsRx = cart.some((i) => i.isRx);
    const toFree = Math.max(0, DELIVERY.freeOver - (subtotal - discount));
    return { subtotal, discount, shipping, total: Math.max(0, subtotal - discount + shipping), count, needsRx, needsCold, freeShip, toFree };
  }, [cart, coupon]);

  const activePet = useMemo(() => {
    const list = pets.items || [];
    return list.find((p) => p.id === petId) || list[0] || null;
  }, [pets.items, petId]);

  const placeOrder = useCallback(async (details) => {
    const id = `PM-${Math.floor(10000 + Math.random() * 89999)}`;
    const user = currentUser;
    const realUser = isRealUser(user);
    const shippingFee = details.shipping ?? totals.shipping;
    const district = details.district || details.city || 'Dhaka';
    const deliveryZone = details.deliveryZone || (district === 'Dhaka' ? 'Inside Dhaka' : 'Outside Dhaka');
    const paymentTrxId = String(details.paymentTrxId || '').trim().toUpperCase();
    const paymentSender = String(details.paymentSender || '').trim();
    const order = {
      orderId: id,
      userId: realUser ? user.uid : 'guest',
      isGuest: !realUser,
      customer: details.name || user?.name || 'Guest',
      email: details.email || user?.email || '',
      phone: details.phone || '',
      address: details.address,
      deliveryAddress: details.address,
      area: details.area || '',
      district,
      city: district,
      deliveryZone,
      deliveryNote: details.note || '',
      delivery: details.delivery || 'Standard',
      items: cart.map(({ id: pid, name, brand, sku, price, basePrice, qty, variant, variantLabel, coursePacks, courseSavePct, subscribe, isRx, coldChain, image }) => ({
        id: pid, name, brand, sku: sku || '', price, basePrice: basePrice ?? price, qty, variant, variantLabel: variantLabel || '', coursePacks: coursePacks || 1, courseSavePct: courseSavePct || 0, subscribe: !!subscribe, isRx: !!isRx, coldChain: !!coldChain, image: image || '',
      })),
      subtotal: totals.subtotal,
      discount: totals.discount,
      coupon: coupon?.code || '',
      shipping: shippingFee,
      total: Math.max(0, totals.subtotal - totals.discount + shippingFee),
      payment: details.payment || 'Cash on delivery',
      paymentMethod: details.payment || 'Cash on delivery',
      paymentStatus: paymentTrxId ? 'verification_pending' : 'cod_pending',
      paymentTrxId,
      paymentSender,
      smsUpdates: details.smsUpdates !== false,
      prescriptionUrl: details.prescriptionUrl || '',
      pet: activePet?.name || '',
      patient: activePet ? `${activePet.name} (${activePet.species}${activePet.weight ? ` • ${activePet.weight}` : ''})` : '',
      status: totals.needsRx ? 'Rx review' : 'Packing',
      rxStatus: totals.needsRx ? 'pending' : '',
      placedAt: Date.now(),
      date: new Date().toISOString().split('T')[0],
      timeline: [{ status: 'Placed', at: Date.now(), by: details.name || user?.name || 'Customer' }],
    };

    let docId = id;
    let handledByCallable = false;

    // 1. Try server-authoritative create_order callable first (atomic stock + coupon + guest/user support)
    if (functions) {
      try {
        const callCreateOrder = httpsCallable(functions, 'create_order');
        const res = await callCreateOrder({ ...order, _track: trackContext() });
        if (res?.data?.orderId) {
          docId = res.data.docId || res.data.orderId;
          handledByCallable = true;
        }
      } catch (callableErr) {
        const msg = String(callableErr?.message || '');
        // Surface real business validation errors (e.g. out of stock, cold chain outside Dhaka)
        if (/out of stock|insufficient stock|cold-chain|prescription/i.test(msg)) {
          throw callableErr;
        }
        // Otherwise fall back to direct Firestore write below (e.g. when functions are not yet deployed)
      }
    }

    // 2. Fallback direct Firestore write (works for both signed-in users and guests via updated firestore.rules)
    if (!handledByCallable) {
      try {
        docId = await addDocument('orders', { ...order, _track: trackContext() });
      } catch (writeErr) {
        if (realUser) throw writeErr;
      }
      const points = Math.max(5, Math.round(order.total / 100));
      Promise.all([
        decrementStock(order.items),
        coupon?.id ? incrementCouponUsage(coupon.id) : Promise.resolve(),
        realUser ? awardPoints(user, points, `Order ${id}`) : Promise.resolve(),
        realUser ? notify(user, {
          title: 'Order placed',
          body: totals.needsRx
            ? `${id} is with our vet for a prescription check. We'll message you once it's approved.`
            : `${id} is being packed. You'll get an update when it's on the way.`,
          category: 'order',
          url: `/account/orders/${id}`,
        }) : Promise.resolve(),
      ]).catch(() => { /* already confirmed to the customer */ });
    }

    track('purchase', { transaction_id: id, value: order.total, shipping: order.shipping, items: order.items.map((l) => toItem(l)) }, `purchase_${id}`);

    // Always keep a local copy so guests (and immediate redirects) can track their order in this browser session
    setLocalOrders((o) => [{ ...order, id, docId }, ...o.filter((x) => x.id !== id)]);
    setCart([]);
    setCoupon(null);
    return id;
  }, [cart, coupon, totals, currentUser, activePet]);

  const updateLocalOrder = useCallback((orderId, patch) => {
    setLocalOrders((list) => list.map((o) => ((o.id === orderId || o.orderId === orderId || o.docId === orderId) ? { ...o, ...patch } : o)));
  }, []);

  const toggleWish = useCallback((id) => {
    let adding;
    setWishlist((w) => { adding = !w.includes(id); return adding ? [...w, id] : w.filter((x) => x !== id); });
    syncWishlist(currentUser, id, adding);
  }, [currentUser]);

  // Pull the saved list down on sign-in, merging anything saved while signed out.
  const savedList = profile.data?.wishlist;
  useEffect(() => {
    if (!Array.isArray(savedList)) return;
    setWishlist((local) => {
      const merged = [...new Set([...savedList, ...local])];
      return merged.length === local.length && merged.every((x, i) => x === local[i]) ? local : merged;
    });
  }, [savedList]);

  const value = {
    user: currentUser,
    profile: profile.data,
    products, vets, coupons, pets, myOrders, localOrders,
    cart, addToCart, setQty, removeLine, clearCart,
    coupon, applyCoupon, removeCoupon: () => setCoupon(null),
    totals, bagOpen, setBagOpen,
    wishlist, toggleWish,
    activePet, setPetId,
    placeOrder, updateLocalOrder,
    toasts, toast, dismissToast,
    theme: themeCtx.theme,
    resolvedTheme: themeCtx.resolvedTheme,
    isDark: themeCtx.isDark,
    setTheme: themeCtx.setTheme,
    toggleTheme: themeCtx.toggleTheme,
  };
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  return useContext(StoreCtx);
}

export { useTheme } from '../context/ThemeContext.jsx';
