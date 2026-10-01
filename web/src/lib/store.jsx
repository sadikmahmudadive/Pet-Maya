import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useMyPets, useProducts, useMyOrders, useVets } from '../data/hooks.js';
import { addDocument, useDoc } from '../data/firestore.js';
import { decrementStock, awardPoints, notify, syncWishlist, isRealUser } from '../data/actions.js';
import { DELIVERY, PROMOS } from '../data/content.js';

const StoreCtx = createContext(null);

const read = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d; } catch { return d; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode */ } };

const lineKey = (id, variant) => `${id}::${variant || ''}`;

export function StoreProvider({ children }) {
  const { currentUser } = useAuth() || {};
  const products = useProducts();
  const vets = useVets();
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

  const addToCart = useCallback((p, { qty = 1, variant = '', open = true, silent = false } = {}) => {
    const key = lineKey(p.id, variant);
    let prev;
    setCart((c) => {
      prev = c;
      const hit = c.find((i) => lineKey(i.id, i.variant) === key);
      if (hit) return c.map((i) => (lineKey(i.id, i.variant) === key ? { ...i, qty: i.qty + qty } : i));
      return [...c, {
        id: p.id, name: p.name, brand: p.brand, price: p.price, compareAt: p.compareAt || null,
        image: p.image || '', isRx: !!p.isRx, coldChain: !!p.coldChain, subscribe: !!p.subscribe, variant, qty,
      }];
    });
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
    if (c === PROMOS.firstOrderCode || c === 'MAYA10') { setCoupon({ code: c, pct: PROMOS.firstOrderPct }); return true; }
    if (c === 'FREESHIP') { setCoupon({ code: c, pct: 0, freeShipping: true }); return true; }
    return false;
  }, []);

  const totals = useMemo(() => {
    const subtotal = cart.reduce((a, i) => a + i.price * i.qty, 0);
    const discount = coupon?.pct ? Math.round(subtotal * coupon.pct / 100) : 0;
    const needsCold = cart.some((i) => i.coldChain);
    const freeShip = coupon?.freeShipping || subtotal - discount >= DELIVERY.freeOver;
    const shipping = cart.length === 0 || freeShip ? 0 : DELIVERY.standardFee;
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
    const order = {
      orderId: id,
      userId: user?.uid || 'guest',
      customer: details.name || user?.name || 'Guest',
      email: details.email || user?.email || '',
      phone: details.phone || '',
      address: details.address,
      deliveryAddress: details.address,
      area: details.area || '',
      deliveryNote: details.note || '',
      delivery: details.delivery,
      items: cart.map(({ id: pid, name, brand, price, qty, variant, isRx, coldChain, image }) => ({ id: pid, name, brand, price, qty, variant, isRx, coldChain, image })),
      subtotal: totals.subtotal,
      discount: totals.discount,
      coupon: coupon?.code || '',
      shipping: details.shipping ?? totals.shipping,
      total: totals.total - totals.shipping + (details.shipping ?? totals.shipping),
      payment: details.payment,
      paymentMethod: details.payment,
      pet: activePet?.name || '',
      patient: activePet ? `${activePet.name} (${activePet.species}${activePet.weight ? ` • ${activePet.weight}` : ''})` : '',
      status: totals.needsRx ? 'Rx review' : 'Packing',
      rxStatus: totals.needsRx ? 'pending' : '',
      placedAt: Date.now(),
      date: new Date().toISOString().split('T')[0],
    };
    if (isRealUser(user)) {
      await addDocument('orders', order);
      // Follow-up writes: none of these should block the confirmation.
      const points = Math.max(5, Math.round(order.total / 100));
      Promise.all([
        decrementStock(order.items),
        awardPoints(user, points, `Order ${id}`),
        notify(user, {
          title: 'Order placed',
          body: totals.needsRx
            ? `${id} is with our vet for a prescription check. We'll message you once it's approved.`
            : `${id} is being packed. You'll get an update when it's on the way.`,
          category: 'order',
          url: `/account/orders/${id}`,
        }),
      ]).catch(() => { /* already confirmed to the customer */ });
    } else {
      setLocalOrders((o) => [{ ...order, id }, ...o]);
    }
    setCart([]);
    setCoupon(null);
    return id;
  }, [cart, coupon, totals, currentUser, activePet]);

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
    products, vets, pets, myOrders, localOrders,
    cart, addToCart, setQty, removeLine, clearCart,
    coupon, applyCoupon, removeCoupon: () => setCoupon(null),
    totals, bagOpen, setBagOpen,
    wishlist, toggleWish,
    activePet, setPetId,
    placeOrder,
    toasts, toast, dismissToast,
  };
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  return useContext(StoreCtx);
}
